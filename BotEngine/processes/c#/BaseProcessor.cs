using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace BotEngine.Processes
{
    public abstract class BaseProcessor
    {
        private string inputData = string.Empty;
        
        public BaseProcessor()
        {
            SetupStdinHandling();
        }

        private void SetupStdinHandling()
        {
            using var reader = new StreamReader(Console.OpenStandardInput());
            inputData = reader.ReadToEnd();
            
            try
            {
                var properties = JsonSerializer.Deserialize<Dictionary<string, object>>(inputData) ?? new Dictionary<string, object>();
                var result = Process(properties);
                SendResult(result);
            }
            catch (Exception error)
            {
                SendError($"Error parsing input: {error.Message}");
            }
        }

        public abstract Dictionary<string, object> Process(Dictionary<string, object> properties);

        protected void SendResult(Dictionary<string, object> result)
        {
            Console.WriteLine(JsonSerializer.Serialize(result));
        }

        protected void SendError(string errorMessage, int exitCode = 1)
        {
            var errorResult = new Dictionary<string, object>
            {
                ["output"] = errorMessage,
                ["exitCode"] = exitCode,
                ["status"] = false
            };
            Console.WriteLine(JsonSerializer.Serialize(errorResult));
        }

        protected string DetectPlatform()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return "windows";
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                return "macos";
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                return "linux";
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.FreeBSD))
                return "unix";
            else
                return "unknown";
        }

        protected void ValidateRequired(Dictionary<string, object> properties, string[] requiredProps)
        {
            foreach (var prop in requiredProps)
            {
                if (!properties.ContainsKey(prop) || properties[prop] == null || string.IsNullOrEmpty(properties[prop].ToString()))
                {
                    throw new Exception($"Required property '{prop}' is missing or empty");
                }
            }
        }

        protected string GetProperty(Dictionary<string, object> properties, string key, string defaultValue = "")
        {
            if (properties.ContainsKey(key) && properties[key] != null)
            {
                return properties[key].ToString() ?? defaultValue;
            }
            return defaultValue;
        }
    }
}
