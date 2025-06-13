using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Runtime.InteropServices;

namespace BotEngine.Processors
{
    /// <summary>
    /// Base class for all C# processors
    /// Handles stdin/stdout communication and provides common utilities
    /// </summary>
    public abstract class BaseProcessor
    {
        protected string InputData { get; private set; } = string.Empty;

        /// <summary>
        /// Constructor that sets up stdin handling
        /// </summary>
        public BaseProcessor()
        {
            SetupStdinHandling();
        }

        /// <summary>
        /// Setup stdin handling to read execution data
        /// </summary>
        private void SetupStdinHandling()
        {
            try
            {
                // Read all input from stdin
                InputData = Console.In.ReadToEnd();

                // Parse and process the input
                var executionData = JsonSerializer.Deserialize<Dictionary<string, object>>(InputData);
                var result = Process(executionData);
                SendResult(result);
            }
            catch (JsonException ex)
            {
                SendError($"Error parsing input JSON: {ex.Message}");
            }
            catch (Exception ex)
            {
                SendError($"Error during processing: {ex.Message}");
            }
        }

        /// <summary>
        /// Process method that must be implemented by child classes
        /// </summary>
        /// <param name="executionData">Contains properties and runtimeInputs</param>
        /// <returns>Result dictionary with output, exitCode, status, and any additional data</returns>
        public abstract Dictionary<string, object> Process(Dictionary<string, object> executionData);

        /// <summary>
        /// Send result to stdout as JSON
        /// </summary>
        /// <param name="result">Result dictionary</param>
        protected void SendResult(Dictionary<string, object> result)
        {
            var json = JsonSerializer.Serialize(result);
            Console.WriteLine(json);
            Console.Out.Flush();
        }

        /// <summary>
        /// Send error result to stdout
        /// </summary>
        /// <param name="errorMessage">Error message</param>
        /// <param name="exitCode">Exit code (default: 1)</param>
        protected void SendError(string errorMessage, int exitCode = 1)
        {
            var errorResult = new Dictionary<string, object>
            {
                ["output"] = errorMessage,
                ["exitCode"] = exitCode,
                ["status"] = false
            };
            
            var json = JsonSerializer.Serialize(errorResult);
            Console.WriteLine(json);
            Console.Out.Flush();
        }

        /// <summary>
        /// Detect the current platform
        /// </summary>
        /// <returns>Platform name</returns>
        protected string DetectPlatform()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                return "windows";
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                return "linux";
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                return "macos";
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.FreeBSD))
                return "unix";
            else
                return "unknown";
        }

        /// <summary>
        /// Validate that required properties are present
        /// </summary>
        /// <param name="properties">Properties to validate</param>
        /// <param name="requiredProps">List of required property names</param>
        /// <exception cref="ArgumentException">Thrown if any required property is missing</exception>
        protected void ValidateRequired(Dictionary<string, object> properties, string[] requiredProps)
        {
            foreach (var prop in requiredProps)
            {
                if (!properties.ContainsKey(prop) || 
                    properties[prop] == null || 
                    string.IsNullOrEmpty(properties[prop].ToString()))
                {
                    throw new ArgumentException($"Required property '{prop}' is missing or empty");
                }
            }
        }

        /// <summary>
        /// Get a property value with a default fallback
        /// </summary>
        /// <param name="properties">Properties dictionary</param>
        /// <param name="key">Property key</param>
        /// <param name="defaultValue">Default value if key is not found</param>
        /// <returns>Property value or default value</returns>
        protected T GetProperty<T>(Dictionary<string, object> properties, string key, T defaultValue = default(T))
        {
            if (properties.ContainsKey(key) && properties[key] != null)
            {
                try
                {
                    if (properties[key] is JsonElement element)
                    {
                        return JsonSerializer.Deserialize<T>(element.GetRawText());
                    }
                    return (T)Convert.ChangeType(properties[key], typeof(T));
                }
                catch
                {
                    return defaultValue;
                }
            }
            return defaultValue;
        }

        /// <summary>
        /// Substitute variables in text using {{variable}} syntax
        /// </summary>
        /// <param name="text">Text containing variables</param>
        /// <param name="variables">Variable values</param>
        /// <returns>Text with variables substituted</returns>
        protected string SubstituteVariables(string text, Dictionary<string, object> variables)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            var result = text;
            foreach (var kvp in variables)
            {
                if (kvp.Value != null)
                {
                    var placeholder = $"{{{{{kvp.Key}}}}}";
                    result = result.Replace(placeholder, kvp.Value.ToString());
                }
            }

            return result;
        }

        /// <summary>
        /// Safely convert value to integer
        /// </summary>
        /// <param name="value">Value to convert</param>
        /// <param name="defaultValue">Default value if conversion fails</param>
        /// <returns>Integer value or default</returns>
        protected int SafeInt(object value, int defaultValue = 0)
        {
            if (value == null) return defaultValue;
            
            if (int.TryParse(value.ToString(), out int result))
                return result;
                
            return defaultValue;
        }

        /// <summary>
        /// Safely convert value to double
        /// </summary>
        /// <param name="value">Value to convert</param>
        /// <param name="defaultValue">Default value if conversion fails</param>
        /// <returns>Double value or default</returns>
        protected double SafeDouble(object value, double defaultValue = 0.0)
        {
            if (value == null) return defaultValue;
            
            if (double.TryParse(value.ToString(), out double result))
                return result;
                
            return defaultValue;
        }

        /// <summary>
        /// Safely convert value to boolean
        /// </summary>
        /// <param name="value">Value to convert</param>
        /// <param name="defaultValue">Default value if conversion fails</param>
        /// <returns>Boolean value or default</returns>
        protected bool SafeBool(object value, bool defaultValue = false)
        {
            if (value == null) return defaultValue;
            
            if (value is bool boolValue)
                return boolValue;
                
            var str = value.ToString().ToLower();
            return str == "true" || str == "1" || str == "yes" || str == "on";
        }

        /// <summary>
        /// Check if file exists and is readable
        /// </summary>
        /// <param name="path">File path</param>
        /// <returns>True if file exists and is readable</returns>
        protected bool FileExists(string path)
        {
            return File.Exists(path) && new FileInfo(path).Length >= 0;
        }

        /// <summary>
        /// Ensure directory exists, create if it doesn't
        /// </summary>
        /// <param name="path">Directory path</param>
        protected void EnsureDirectory(string path)
        {
            Directory.CreateDirectory(path);
        }

        /// <summary>
        /// Get value from runtimeInputs with fallback to properties
        /// </summary>
        /// <param name="executionData">Full execution data</param>
        /// <param name="key">Primary key to look for</param>
        /// <param name="fallbackKey">Fallback key if primary not found</param>
        /// <param name="defaultValue">Default value if neither key is found</param>
        /// <returns>Value from runtimeInputs, properties, or default</returns>
        protected T GetRuntimeInput<T>(Dictionary<string, object> executionData, string key, string fallbackKey = null, T defaultValue = default(T))
        {
            // Get runtime inputs
            var runtimeInputs = new Dictionary<string, object>();
            if (executionData.ContainsKey("runtimeInputs") && executionData["runtimeInputs"] is JsonElement runtimeElement)
            {
                runtimeInputs = JsonSerializer.Deserialize<Dictionary<string, object>>(runtimeElement.GetRawText());
            }

            // Get properties
            var properties = new Dictionary<string, object>();
            if (executionData.ContainsKey("properties") && executionData["properties"] is JsonElement propsElement)
            {
                var propsDict = JsonSerializer.Deserialize<Dictionary<string, object>>(propsElement.GetRawText());
                if (propsDict.ContainsKey("properties") && propsDict["properties"] is JsonElement innerProps)
                {
                    properties = JsonSerializer.Deserialize<Dictionary<string, object>>(innerProps.GetRawText());
                }
            }

            // Check runtime inputs first
            if (runtimeInputs.ContainsKey(key))
                return GetProperty(runtimeInputs, key, defaultValue);

            // Check properties with original key
            if (properties.ContainsKey(key))
                return GetProperty(properties, key, defaultValue);

            // Check properties with fallback key
            if (!string.IsNullOrEmpty(fallbackKey) && properties.ContainsKey(fallbackKey))
                return GetProperty(properties, fallbackKey, defaultValue);

            return defaultValue;
        }
    }
}
