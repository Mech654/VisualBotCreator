using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using Dapper;
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
            dynamic nodeObj = GetNodeObj(startId);
            switch (nodeObj.properities.language)
            {
                case "C#":
                    ExecuteCSharpNode(nodeObj);
                    break;
                case "Python":
                    ExecutePythonNode(nodeObj);
                    break;
                case "JavaScript":
                    ExecuteJavaScriptNode(nodeObj);
                    break;
                default:
                    throw new NotSupportedException($"Language {nodeObj.properities.language} is not supported.");
            }

            if (RAM.Count > 0)
            {
                var lastNode = RAM.Last();
                if (lastNode.Value.TryGetValue("NextNodeId", out var nextNodeId) && !string.IsNullOrEmpty(nextNodeId))
                {
                    Run(nextNodeId);
                }
            }
        }

        private dynamic GetNodeObj(string nodeId)
        {
            var dbPath = Path.Combine(Directory.GetParent(AppContext.BaseDirectory)?.FullName ?? "", "VisualBotCreator.db");
            var connectionString = $"Data Source={dbPath}";

            using var connection = new SqliteConnection(connectionString);
            connection.Open();
            
            var definitionJson = connection.QuerySingleOrDefault<string>(
                "SELECT Definition FROM Nodes WHERE NodeId = @nodeId LIMIT 1", 
                new { nodeId });

            return definitionJson != null 
                ? JsonConvert.DeserializeObject(definitionJson)! 
                : throw new Exception($"Node with NodeId '{nodeId}' not found in database.");
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

            string? responseJson = process.StandardOutput.ReadLine();
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

            string? responseJson = process.StandardOutput.ReadLine();
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
            var startInfo = new ProcessStartInfo()
            {
                FileName = "node",
                Arguments = $"{nodeObj.type}.js",
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

            string? responseJson = process.StandardOutput.ReadLine();
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
    }
}