using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using System.Linq;


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
            dynamic nodeObj = null;
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
            Console.WriteLine($"[Run] Loaded node: id={nodeObj.id}, type={nodeObj.type}, language={nodeObj.language}");

            switch (nodeObj.language)
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

            if (RAM.Count > 0)
            {
            var lastNode = RAM.Last();
            Console.WriteLine($"[Run] Node {lastNode.Key} executed. Output: {JsonConvert.SerializeObject(lastNode.Value)}");
            if (lastNode.Value.TryGetValue("NextNodeId", out var nextNodeId) && !string.IsNullOrEmpty(nextNodeId))
            {
                Console.WriteLine($"[Run] Proceeding to next node: {nextNodeId}");
                Run(nextNodeId);
            }
            else
            {
                Console.WriteLine("[Run] No NextNodeId found. Execution finished.");
            }
            }
            else
            {
            Console.WriteLine("[Run] No output in RAM. Execution finished.");
            }
        }

        private void TestDatabaseConnection(string fullDbPath)
        {
            Console.WriteLine("[TestDB] Testing database connection and listing nodes...");
            
            try
            {
                var connectionString = $"Data Source={fullDbPath};Timeout=30";
                using (var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString))
                {
                    connection.Open();
                    Console.WriteLine("[TestDB] Database connection successful");
                    
                    // First, check the schema
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = "SELECT sql FROM sqlite_master WHERE type='table' AND name='Nodes'";
                        var schema = command.ExecuteScalar()?.ToString();
                        Console.WriteLine($"[TestDB] Nodes table schema: {schema}");
                    }
                    
                    // Count total nodes
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = "SELECT COUNT(*) FROM Nodes";
                        var count = command.ExecuteScalar();
                        Console.WriteLine($"[TestDB] Total nodes in database: {count}");
                    }
                    
                    // List first 5 node IDs
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = "SELECT NodeId FROM Nodes LIMIT 5";
                        using (var reader = command.ExecuteReader())
                        {
                            Console.WriteLine("[TestDB] Sample NodeIds:");
                            while (reader.Read())
                            {
                                Console.WriteLine($"[TestDB] - {reader.GetString(0)}");
                            }
                        }
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
            Console.WriteLine($"[GetNodeObj] Current directory: {currentDir}");
            
            var dbPath = Path.Combine(currentDir, "..", "VisualBotCreator.db");
            var fullDbPath = Path.GetFullPath(dbPath);
            Console.WriteLine($"[GetNodeObj] Database path: {fullDbPath}");
            Console.WriteLine($"[GetNodeObj] Database exists: {File.Exists(fullDbPath)}");
            
            if (!File.Exists(fullDbPath))
            {
                throw new Exception($"Database file not found at: {fullDbPath}");
            }
            
            var connectionString = $"Data Source={fullDbPath};Timeout=10";
            Console.WriteLine($"[GetNodeObj] Connection string: {connectionString}");
            Console.WriteLine($"[GetNodeObj] Searching for NodeId: {nodeId}");

            try
            {
                using (var connection = new Microsoft.Data.Sqlite.SqliteConnection(connectionString))
                {
                    Console.WriteLine("[GetNodeObj] About to open database connection...");
                    Console.WriteLine("[GetNodeObj] Attempting connection.Open()...");
                    connection.Open();
                    Console.WriteLine("[GetNodeObj] Database connection opened successfully");
                    
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = "SELECT Definition FROM Nodes WHERE NodeId = @nodeId LIMIT 1";
                        command.Parameters.AddWithValue("@nodeId", nodeId);
                        Console.WriteLine($"[GetNodeObj] Executing query: {command.CommandText}");
                        Console.WriteLine($"[GetNodeObj] With parameter: @nodeId = {nodeId}");

                        using (var reader = command.ExecuteReader())
                        {
                            Console.WriteLine("[GetNodeObj] Query executed, checking for results...");
                            
                            if (reader.Read())
                            {
                                var definitionJson = reader.GetString(0);
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
                                throw new Exception($"Node with NodeId '{nodeId}' not found in database.");
                            }
                        }
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

            var dataToSend = JsonConvert.SerializeObject(nodeObj.properities);
            process.StandardInput.WriteLine(dataToSend);
            process.StandardInput.Flush();

            string responseJson = process.StandardOutput.ReadLine();
            if (!string.IsNullOrEmpty(responseJson))
            {
                var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                if (responseDict != null)
                {
                    RAM[nodeObj.id.ToString()] = responseDict;
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

            var dataToSend = JsonConvert.SerializeObject(nodeObj.properities);
            process.StandardInput.WriteLine(dataToSend);
            process.StandardInput.Flush();

            string responseJson = process.StandardOutput.ReadLine();
            if (!string.IsNullOrEmpty(responseJson))
            {
                var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                if (responseDict != null)
                {
                    RAM[nodeObj.id.ToString()] = responseDict;
                }
            }
            
            process.StandardInput.Close();
            process.WaitForExit();
        }

        private void ExecuteJavaScriptNode(dynamic nodeObj)
        {
            Console.WriteLine($"[ExecuteJavaScriptNode] Current directory: {Directory.GetCurrentDirectory()}");
            Console.WriteLine($"[ExecuteJavaScriptNode] Looking for file: {nodeObj.type}.js");
            
            var jsFilePath = Path.Combine("processes", "node", $"{nodeObj.type}.js");
            var fullJsPath = Path.GetFullPath(jsFilePath);
            Console.WriteLine($"[ExecuteJavaScriptNode] Full JS file path: {fullJsPath}");
            Console.WriteLine($"[ExecuteJavaScriptNode] JS file exists: {File.Exists(fullJsPath)}");
            
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

            Console.WriteLine($"[ExecuteJavaScriptNode] Starting process: node {jsFilePath}");
            Console.WriteLine($"[ExecuteJavaScriptNode] Working directory: {startInfo.WorkingDirectory}");
            
            var process = new Process() { StartInfo = startInfo };
            process.Start();

            var dataToSend = JsonConvert.SerializeObject(nodeObj.properities);
            Console.WriteLine($"[ExecuteJavaScriptNode] Sending data: {dataToSend}");
            
            process.StandardInput.WriteLine(dataToSend);
            process.StandardInput.Flush();

            string responseJson = process.StandardOutput.ReadLine();
            string errorOutput = process.StandardError.ReadToEnd();
            
            Console.WriteLine($"[ExecuteJavaScriptNode] Response: {responseJson}");
            if (!string.IsNullOrEmpty(errorOutput))
            {
                Console.WriteLine($"[ExecuteJavaScriptNode] Error output: {errorOutput}");
            }
            
            if (!string.IsNullOrEmpty(responseJson))
            {
                var responseDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(responseJson);
                if (responseDict != null)
                {
                    RAM[nodeObj.id.ToString()] = responseDict;
                }
            }
            
            process.StandardInput.Close();
            process.WaitForExit();
            
            Console.WriteLine($"[ExecuteJavaScriptNode] Process exit code: {process.ExitCode}");
        }
    }
}