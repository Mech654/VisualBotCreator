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

        public Bot(string startId)
        {
            RAM = new Dictionary<string, Dictionary<string, string>>();
            StartId = startId;
            Run(startId);
        }

        private void Run(string startId)
        {
            Console.WriteLine($"[Run] Running bot with StartNodeId: {startId}");
            dynamic? nodeObj = null;
            try
            {
                nodeObj = GetNodeObj(startId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Run] Error loading node: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"[Run] Inner exception: {ex.InnerException.Message}");
                Console.WriteLine($"[Run] StackTrace: {ex.StackTrace}");
                throw;
            }
            Console.WriteLine($"[Run] Loaded node: type={nodeObj.type}, language={nodeObj.properties?.language}");

            var language = (string?)nodeObj.properties?.language ?? "";
            switch (language)
            {
            case "C#":
                Console.WriteLine($"[Run] Executing C# node: {nodeObj.type}");
                ExecuteCSharpNode(nodeObj);
                break;
            case "Python":
                Console.WriteLine($"[Run] Executing Python node: {nodeObj.type}");
                ExecutePythonNode(nodeObj);
                break;
            case "JavaScript":
                Console.WriteLine($"[Run] Executing JavaScript node: {nodeObj.type}");
                ExecuteJavaScriptNode(nodeObj);
                break;
            default:
                Console.WriteLine($"[Run] Unsupported language: {nodeObj.language}");
                throw new NotSupportedException($"Language {nodeObj.language} is not supported.");
            }

            Console.WriteLine($"[Run] ===== Checking navigation after {nodeObj.type} node =====");
            
            if (RAM.Count > 0)
            {
                var lastNode = RAM.Last();
                Console.WriteLine($"[Run] {lastNode.Key} executed successfully");
                
                // Check if the response has a NextNodeId
                if (lastNode.Value.TryGetValue("NextNodeId", out var nextNodeId) && !string.IsNullOrEmpty(nextNodeId))
                {
                    Console.WriteLine($"[Run] Found NextNodeId in response: {nextNodeId}");
                    Run(nextNodeId);
                }
                else
                {
                    Console.WriteLine("[Run] No NextNodeId in response, checking node outputs...");
                    // Check the node definition for connected outputs
                    var nextNode = GetNextNodeFromOutputs(nodeObj);
                    if (!string.IsNullOrEmpty(nextNode))
                    {
                        Console.WriteLine($"[Run] Found connected next node: {nextNode}");
                        Run(nextNode);
                    }
                    else
                    {
                        Console.WriteLine("[Run] No connected nodes found. Execution finished.");
                    }
                }
            }
            else
            {
                Console.WriteLine("[Run] No output stored in RAM, checking node outputs...");
                // Check the node definition for connected outputs
                var nextNode = GetNextNodeFromOutputs(nodeObj);
                if (!string.IsNullOrEmpty(nextNode))
                {
                    Console.WriteLine($"[Run] Found connected next node: {nextNode}");
                    Run(nextNode);
                }
                else
                {
                    Console.WriteLine("[Run] No connected nodes found. Execution finished.");
                }
            }
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
            try
            {
                using (var fileStream = File.Open(fullDbPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    Console.WriteLine("[GetNodeObj] Database file can be opened for reading");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetNodeObj] Warning: Cannot open database file for reading: {ex.Message}");
            }                try
                {
                    Console.WriteLine("[GetNodeObj] Creating and opening database connection...");
                    using (var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString))
                    {
                        connection.Open();
                        Console.WriteLine("[GetNodeObj] Database connection opened successfully");
                        
                        // First, let's check if the table exists and has data
                        Console.WriteLine("[GetNodeObj] Checking if Nodes table exists...");
                        var tableExists = connection.QueryFirstOrDefault<int>("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Nodes'");
                        Console.WriteLine($"[GetNodeObj] Nodes table exists: {tableExists > 0}");
                        
                        if (tableExists > 0)
                        {
                            var totalCount = connection.QueryFirstOrDefault<int>("SELECT COUNT(*) FROM Nodes");
                            Console.WriteLine($"[GetNodeObj] Total nodes in database: {totalCount}");
                            
                            // Check if our specific node exists
                            var nodeExists = connection.QueryFirstOrDefault<int>("SELECT COUNT(*) FROM Nodes WHERE NodeId = @nodeId", new { nodeId });
                            Console.WriteLine($"[GetNodeObj] Node with ID '{nodeId}' exists: {nodeExists > 0}");
                        }
                        
                        Console.WriteLine($"[GetNodeObj] Executing query with Dapper for NodeId: {nodeId}");
                        var sql = "SELECT Definition FROM Nodes WHERE NodeId = @nodeId LIMIT 1";
                        Console.WriteLine($"[GetNodeObj] About to execute SQL: {sql}");
                        var definitionJson = connection.QueryFirstOrDefault<string>(sql, new { nodeId });
                        Console.WriteLine($"[GetNodeObj] Query completed successfully, result is null: {definitionJson == null}");
                        
                        if (!string.IsNullOrEmpty(definitionJson))
                        {
                            Console.WriteLine($"[GetNodeObj] Found node definition: {definitionJson}");
                            
                            try
                            {
                                var nodeObj = JsonConvert.DeserializeObject(definitionJson);
                                Console.WriteLine("[GetNodeObj] JSON deserialization successful");
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

        private void ExecuteCSharpNode(dynamic nodeObj)
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

            var dataToSend = JsonConvert.SerializeObject(nodeObj.properties);
            process.StandardInput.WriteLine(dataToSend);
            process.StandardInput.Flush();

            string? responseJson = process.StandardOutput.ReadLine();
            if (!string.IsNullOrEmpty(responseJson))
            {
                var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                if (responseDict != null)
                {
                    RAM[nodeObj.type.ToString()] = responseDict;
                }
            }
            
            process.StandardInput.Close();
            process.WaitForExit();
        }

        private void ExecutePythonNode(dynamic nodeObj)
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

            var dataToSend = JsonConvert.SerializeObject(nodeObj.properties);
            process.StandardInput.WriteLine(dataToSend);
            process.StandardInput.Flush();

            string? responseJson = process.StandardOutput.ReadLine();
            if (!string.IsNullOrEmpty(responseJson))
            {
                var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                if (responseDict != null)
                {
                    RAM[nodeObj.type.ToString()] = responseDict;
                }
            }
            
            process.StandardInput.Close();
            process.WaitForExit();
        }

        private void ExecuteJavaScriptNode(dynamic nodeObj)
        {
            var jsFilePath = Path.Combine("processes", "node", $"{nodeObj.type}.js");
            
            if (!File.Exists(jsFilePath))
            {
                Console.WriteLine($"[ExecuteJavaScriptNode] ERROR: File not found: {jsFilePath}");
                return;
            }
            
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

            var dataToSend = JsonConvert.SerializeObject(nodeObj.properties);
            Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | Input: {dataToSend}");
            
            process.StandardInput.WriteLine(dataToSend);
            process.StandardInput.Flush();
            process.StandardInput.Close(); // Close stdin to trigger the 'end' event in Node.js

            string? responseJson = process.StandardOutput.ReadLine();
            string? errorOutput = process.StandardError.ReadToEnd();
            Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | Response: {responseJson}");
            
            if (!string.IsNullOrEmpty(errorOutput))
            {
                Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | Error: {errorOutput}");
            }
            
            if (!string.IsNullOrEmpty(responseJson))
            {
                try
                {
                    // First try to deserialize as dynamic to handle mixed types
                    var responseDynamic = JsonConvert.DeserializeObject(responseJson);
                    var responseDict = new Dictionary<string, string>();
                    
                    if (responseDynamic is Newtonsoft.Json.Linq.JObject jObj)
                    {
                        foreach (var prop in jObj.Properties())
                        {
                            responseDict[prop.Name] = prop.Value?.ToString() ?? "";
                        }
                    }
                    
                    if (responseDict.Count > 0)
                    {
                        RAM[nodeObj.type.ToString()] = responseDict;
                        Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | Stored in RAM: {string.Join(", ", responseDict.Select(kv => $"{kv.Key}={kv.Value}"))}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | Failed to parse response: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | No response received");
            }
            
            process.WaitForExit();
            
            if (process.ExitCode != 0)
            {
                Console.WriteLine($"[ExecuteJavaScriptNode] Node: {nodeObj.type} | Process exited with code: {process.ExitCode}");
            }
        }

        private string? GetNextNodeFromOutputs(dynamic nodeObj)
        {
            try
            {
                Console.WriteLine($"[GetNextNodeFromOutputs] Checking outputs for node: {nodeObj.type}");
                
                if (nodeObj.outputs != null)
                {
                    Console.WriteLine($"[GetNextNodeFromOutputs] Found {nodeObj.outputs.Count} outputs");
                    
                    foreach (var output in nodeObj.outputs)
                    {
                        Console.WriteLine($"[GetNextNodeFromOutputs] Checking output: {output.id} ({output.label})");
                        
                        if (output.connectedTo != null && output.connectedTo.Count > 0)
                        {
                            Console.WriteLine($"[GetNextNodeFromOutputs] Output has {output.connectedTo.Count} connections");
                            
                            var connection = output.connectedTo[0];
                            if (connection.toNodeId != null)
                            {
                                var nextNodeId = connection.toNodeId.ToString();
                                Console.WriteLine($"[GetNextNodeFromOutputs] Found next node: {nextNodeId}");
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