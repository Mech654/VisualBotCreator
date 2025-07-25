using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using System.Linq;
using Dapper;
using System.Threading.Tasks;


namespace BotEngine
{
    public class Bot
    {
        public Dictionary<string, Dictionary<string, string>> RAM { get; private set; }
        public string StartId { get; private set; }
        private Debugger? Debugger { get; set; }

        public Bot(string startId, Debugger? debuggerInstance = null)
        {
            RAM = new Dictionary<string, Dictionary<string, string>>();
            StartId = startId;
            Debugger = debuggerInstance;
        }

        public async Task<string> Run(string startId)
        {
            // Notify debugger that node execution is starting
            if (Debugger != null)
            {
                await Debugger.SendNodeStart(startId);
                System.Threading.Thread.Sleep(1000); // this is so user can see the workflow go.
            }

            dynamic? nodeObj = null;
            try
            {
                nodeObj = GetNodeObj(startId);
            }
            catch (Exception ex)
            {
                // Notify debugger of error
                if (Debugger != null)
                {
                    await Debugger.SendNodeError(startId, ex.Message);
                }
                return $"Node load error: {ex.Message}";
            }

            var language = (string?)nodeObj.properties?.language ?? "";
            string execResult = "Success";
            
            try
            {
                switch (language)
                {
                    case "C#":
                        execResult = ExecuteCSharpNode(nodeObj);
                        break;
                    case "Python":
                        execResult = ExecutePythonNode(nodeObj);
                        break;
                    case "JavaScript":
                        execResult = ExecuteJavaScriptNode(nodeObj);
                        break;
                    default:
                        execResult = $"Unsupported language: {language}";
                        break;
                }
            }
            catch (Exception ex)
            {
                execResult = $"Execution error: {ex.Message}";
            }
            
            // Notify debugger of execution result
            if (Debugger != null)
            {
                if (execResult == "Success")
                {
                    await Debugger.SendNodeComplete(startId, execResult);
                }
                else
                {
                    await Debugger.SendNodeError(startId, execResult);
                }
            }

            Console.WriteLine($"[Debug] Node {startId} executed with result: {execResult}");

            if (execResult != "Success")
            {
                return execResult;
            }

            if (RAM.Count > 0)
            {
                var lastNode = RAM.Last();
                if (lastNode.Value.TryGetValue("NextNodeId", out var nextNodeId) && !string.IsNullOrEmpty(nextNodeId))
                {
                    return await Run(nextNodeId);
                }
                else
                {
                    var nextNode = GetNextNodeFromOutputs(nodeObj);
                    if (!string.IsNullOrEmpty(nextNode))
                    {
                        return await Run(nextNode);
                    }
                    else
                    {
                        return "Success";
                    }
                }
            }
            
            return "No next node found";
        }

        private void TestDatabaseConnection(string fullDbPath)
        {
            Console.WriteLine("[TestDB] Testing database connection and listing nodes...");

            try
            {
                var connectionString = $"Data Source={fullDbPath}";
                using (var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString))
                {
                    connection.Open();
                    Console.WriteLine("[TestDB] Database connection successful");

                    // First, check the schema
                    var schema = connection.QueryFirstOrDefault<string>("SELECT sql FROM sqlite_master WHERE type='table' AND name='Nodes'");
                    Console.WriteLine($"[TestDB] Nodes table schema: {schema}");

                    // Count total nodes
                    var count = connection.QueryFirstOrDefault<int>("SELECT COUNT(*) FROM Nodes");
                    Console.WriteLine($"[TestDB] Total nodes in database: {count}");

                    // List first 5 node IDs
                    var nodeIds = connection.Query<string>("SELECT NodeId FROM Nodes LIMIT 5");
                    Console.WriteLine("[TestDB] Sample NodeIds:");
                    foreach (var nodeId in nodeIds)
                    {
                        Console.WriteLine($"[TestDB] - {nodeId}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TestDB] Database test failed: {ex.Message}");
            }
        }

        private dynamic GetNodeObj(string nodeId)
        {
            var currentDir = Directory.GetCurrentDirectory();
            var dbPath = Path.Combine(currentDir, "..", "VisualBotCreator.db");
            var fullDbPath = Path.GetFullPath(dbPath);

            if (!File.Exists(fullDbPath))
            {
                throw new Exception($"Database file not found at: {fullDbPath}");
            }

            var connectionString = $"Data Source={fullDbPath}";
            Console.WriteLine($"[GetNodeObj] Searching for NodeId: {nodeId}");

            // Check if database file is locked
            try { using (var fileStream = File.Open(fullDbPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite)) { } }
            catch (Exception ex) { Console.WriteLine($"[GetNodeObj] Warning: Cannot open database file for reading: {ex.Message}"); }

            try
            {
                using (var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString))
                {
                    connection.Open();

                    var sql = "SELECT Definition FROM Nodes WHERE NodeId = @nodeId LIMIT 1";
                    var definitionJson = connection.QueryFirstOrDefault<string>(sql, new { nodeId });

                    if (!string.IsNullOrEmpty(definitionJson))
                    {
                        try
                        {
                            var nodeObj = JsonConvert.DeserializeObject(definitionJson);
                            return nodeObj!;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[GetNodeObj] JSON deserialization failed: {ex.Message}");
                            throw new Exception($"Failed to deserialize node definition: {ex.Message}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[GetNodeObj] No node found with NodeId: {nodeId}");

                        // Let's see what nodes are actually in the database
                        Console.WriteLine("[GetNodeObj] Listing first 5 NodeIds in database:");
                        var sampleNodes = connection.Query<string>("SELECT NodeId FROM Nodes LIMIT 5");
                        foreach (var sampleNodeId in sampleNodes)
                        {
                            Console.WriteLine($"[GetNodeObj] - {sampleNodeId}");
                        }

                        throw new Exception($"Node with NodeId '{nodeId}' not found in database.");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetNodeObj] Database operation failed: {ex.Message}");
                Console.WriteLine($"[GetNodeObj] Exception type: {ex.GetType().Name}");
                Console.WriteLine($"[GetNodeObj] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        private string ExecuteCSharpNode(dynamic nodeObj)
        {
            try
            {
                var startInfo = new ProcessStartInfo()
                {
                    FileName = "dotnet",
                    Arguments = $"run --project {nodeObj.type}.csproj",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                var process = new Process() { StartInfo = startInfo };
                process.Start();
                var dataToSend = PrepareNodeExecutionData(nodeObj);
                process.StandardInput.WriteLine(dataToSend);
                process.StandardInput.Flush();
                string? responseJson = process.StandardOutput.ReadLine();
                string? errorOutput = process.StandardError.ReadToEnd();
                process.StandardInput.Close();
                process.WaitForExit();
                if (!string.IsNullOrEmpty(errorOutput))
                    return $"Node error: {errorOutput.Trim()}";
                if (!string.IsNullOrEmpty(responseJson))
                {
                    var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                    if (responseDict != null)
                    {
                        RAM[nodeObj.type.ToString()] = responseDict;
                        return "Success";
                    }
                    else
                        return "Node error: Invalid response format.";
                }
                else
                    return "Node error: No response.";
            }
            catch (Exception ex)
            {
                return $"Node error: {ex.Message}";
            }
        }

        private string ExecutePythonNode(dynamic nodeObj)
        {
            try
            {
                var startInfo = new ProcessStartInfo()
                {
                    FileName = "python",
                    Arguments = $"{nodeObj.type}.py",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                var process = new Process() { StartInfo = startInfo };
                process.Start();
                var dataToSend = PrepareNodeExecutionData(nodeObj);
                process.StandardInput.WriteLine(dataToSend);
                process.StandardInput.Flush();
                string? responseJson = process.StandardOutput.ReadLine();
                string? errorOutput = process.StandardError.ReadToEnd();
                process.StandardInput.Close();
                process.WaitForExit();
                if (!string.IsNullOrEmpty(errorOutput))
                    return $"Node error: {errorOutput.Trim()}";
                if (!string.IsNullOrEmpty(responseJson))
                {
                    var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                    if (responseDict != null)
                    {
                        RAM[nodeObj.type.ToString()] = responseDict;
                        return "Success";
                    }
                    else
                        return "Node error: Invalid response format.";
                }
                else
                    return "Node error: No response.";
            }
            catch (Exception ex)
            {
                return $"Node error: {ex.Message}";
            }
        }

        private string PrepareNodeExecutionData(dynamic nodeObj)
        {
            var runtimeInputs = new Dictionary<string, object>();

            if (nodeObj.inputs != null)
            {
                foreach (var input in nodeObj.inputs)
                {
                    if (input.connectedTo != null && input.connectedTo.Count > 0)
                    {
                        var connection = input.connectedTo[0];
                        var sourceNodeId = connection.fromNodeId?.ToString();
                        var sourcePortId = connection.fromPortId?.ToString();

                        if (!string.IsNullOrEmpty(sourceNodeId) && !string.IsNullOrEmpty(sourcePortId))
                        {
                            foreach (var ramEntry in RAM)
                            {
                                if (ramEntry.Value.ContainsKey(sourcePortId))
                                {
                                    runtimeInputs[input.id.ToString()] = ramEntry.Value[sourcePortId];
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            var executionData = new
            {
                properties = nodeObj.properties,
                runtimeInputs = runtimeInputs,
                inputs = nodeObj.inputs,
                outputs = nodeObj.outputs
            };

            return JsonConvert.SerializeObject(executionData);
        }

        private string ExecuteJavaScriptNode(dynamic nodeObj)
        {
            try
            {
                var jsFilePath = Path.Combine("processes", "node", $"{nodeObj.type}.js");
                if (!File.Exists(jsFilePath))
                    return $"Node error: JS file not found.";
                var startInfo = new ProcessStartInfo()
                {
                    FileName = "node",
                    Arguments = jsFilePath,
                    WorkingDirectory = Directory.GetCurrentDirectory(),
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                var process = new Process() { StartInfo = startInfo };
                process.Start();
                var dataToSend = PrepareNodeExecutionData(nodeObj);
                process.StandardInput.WriteLine(dataToSend);
                process.StandardInput.Flush();
                process.StandardInput.Close();
                string? responseJson = process.StandardOutput.ReadLine();
                string? errorOutput = process.StandardError.ReadToEnd();
                process.WaitForExit();
                if (!string.IsNullOrEmpty(errorOutput))
                    return $"Node error: {errorOutput.Trim()}";
                if (!string.IsNullOrEmpty(responseJson))
                {
                    try
                    {
                        var responseDynamic = JsonConvert.DeserializeObject(responseJson);
                        var responseDict = new Dictionary<string, string>();
                        if (responseDynamic is Newtonsoft.Json.Linq.JObject jObj)
                        {
                            foreach (var prop in jObj.Properties())
                                responseDict[prop.Name] = prop.Value?.ToString() ?? "";
                        }
                        if (responseDict.Count > 0)
                        {
                            RAM[nodeObj.type.ToString()] = responseDict;
                            return "Success";
                        }
                        else
                            return "Node error: Empty response.";
                    }
                    catch (Exception ex)
                    {
                        return $"Node error: {ex.Message}";
                    }
                }
                else
                    return "Node error: No response.";
            }
            catch (Exception ex)
            {
                return $"Node error: {ex.Message}";
            }
        }

        private string? GetNextNodeFromOutputs(dynamic nodeObj)
        {
            try
            {
                if (nodeObj.outputs != null)
                {
                    foreach (var output in nodeObj.outputs)
                    {
                        if (output.connectedTo != null && output.connectedTo.Count > 0)
                        {
                            var connection = output.connectedTo[0];
                            if (connection.toNodeId != null)
                            {
                                var nextNodeId = connection.toNodeId.ToString();
                                return nextNodeId;
                            }
                        }
                        else
                        {
                            Console.WriteLine($"[GetNextNodeFromOutputs] Output '{output.id}' has no connections");
                        }
                    }
                }
                else
                {
                    Console.WriteLine($"[GetNextNodeFromOutputs] Node has no outputs");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetNextNodeFromOutputs] Error extracting next node: {ex.Message}");
            }

            Console.WriteLine($"[GetNextNodeFromOutputs] No connected nodes found");
            return null;
        }

    }
}