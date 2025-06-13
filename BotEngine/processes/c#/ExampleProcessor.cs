using System;
using System.Collections.Generic;
using BotEngine.Processors;

namespace BotEngine.Processors
{
    /// <summary>
    /// Example C# processor demonstrating the BaseProcessor usage
    /// This would be similar to the StringVariable processor
    /// </summary>
    public class ExampleProcessor : BaseProcessor
    {
        public override Dictionary<string, object> Process(Dictionary<string, object> executionData)
        {
            try
            {
                // Get value using the base class helper
                var value = GetRuntimeInput<string>(executionData, "value", defaultValue: "");

                return new Dictionary<string, object>
                {
                    ["output"] = $"Processed value: {value}",
                    ["value"] = value,
                    ["exitCode"] = 0,
                    ["status"] = true
                };
            }
            catch (Exception ex)
            {
                return new Dictionary<string, object>
                {
                    ["output"] = $"Error processing: {ex.Message}",
                    ["value"] = "",
                    ["exitCode"] = 1,
                    ["status"] = false
                };
            }
        }
    }

    /// <summary>
    /// Program entry point
    /// </summary>
    class Program
    {
        static void Main(string[] args)
        {
            var processor = new ExampleProcessor();
        }
    }
}
