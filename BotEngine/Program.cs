

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Data.Sqlite;
using Dapper;

namespace BotEngine
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("BotEngine started. Press Ctrl+C to stop.");
            
            while (true)
            {
                try
                {
                    var list = CheckRunCondition();
                    foreach (var startNodeId in list)
                    {
                        System.Threading.Tasks.Task.Run(() =>
                        {
                            Console.WriteLine($"Bot started with StartNodeId: {startNodeId}");
                            var bot = new Bot(startNodeId);
                        });
                    }
                    
                    // Wait 60 seconds before checking conditions again
                    System.Threading.Thread.Sleep(60000);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in main loop: {ex.Message}");
                    // Wait a bit before retrying to avoid rapid error loops
                    System.Threading.Thread.Sleep(5000);
                }
            }
        }


        private static List<string> CheckRunCondition()
        {
            var startNodeIds = new List<string>();
            
            try
            {
                var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "VisualBotCreator.db");
                var connectionString = $"Data Source={dbPath}";

                using var connection = new SqliteConnection(connectionString);
                connection.Open();

                var allRunConditions = connection.Query<dynamic>(
                    "SELECT BotId, Key, Value FROM RunConditions"
                ).ToList();

                var now = DateTime.Now;
                var validBotIds = new HashSet<string>();

                foreach (var condition in allRunConditions)
                {
                    string botId = condition.BotId;
                    string key = condition.Key;
                    string value = condition.Value;

                    Console.WriteLine($"Checking condition - BotId: {botId}, Key: {key}, Value: {value}");

                    bool conditionMet = false;

                    switch (key)
                    {
                        case "Time of Day (HH:MM)":
                            if (TimeSpan.TryParse(value, out var targetTime))
                            {
                                var currentTime = now.TimeOfDay;
                                conditionMet = Math.Abs((currentTime - targetTime).TotalMinutes) <= 1;
                                Console.WriteLine($"Time check: Current={currentTime}, Target={targetTime}, Met={conditionMet}");
                            }
                            break;

                        case "Day of Week":
                            var currentDayName = now.DayOfWeek.ToString();
                            var currentDayNumber = ((int)now.DayOfWeek == 0 ? 7 : (int)now.DayOfWeek).ToString(); // Convert Sunday=0 to Sunday=7
                            Console.WriteLine($"Day check: Current='{currentDayName}' (Day {currentDayNumber}), Value='{value}'");
                            conditionMet = string.Equals(value, currentDayName, StringComparison.OrdinalIgnoreCase) || 
                                          string.Equals(value, currentDayNumber);
                            Console.WriteLine($"Day condition met: {conditionMet}");
                            break;

                        case "Specific Date (YYYY-MM-DD)":
                            var parts = value.Split(' ');
                            var datePart = parts[0];
                            
                            if (DateTime.TryParse(datePart, out var targetDate))
                            {
                                if (parts.Length > 1 && TimeSpan.TryParse(parts[1], out var specificTime))
                                {
                                    var targetDateTime = targetDate.Date + specificTime;
                                    conditionMet = Math.Abs((now - targetDateTime).TotalMinutes) <= 1;
                                }
                                else
                                {
                                    conditionMet = now.Date == targetDate.Date;
                                }
                            }
                            break;
                    }

                    if (conditionMet)
                    {
                        validBotIds.Add(botId);
                    }
                }

                foreach (var botId in validBotIds)
                {
                    var isBotEnabled = connection.QuerySingleOrDefault<int>(
                        "SELECT enabled FROM Bots WHERE Id = @botId",
                        new { botId }
                    );

                    if (isBotEnabled == 1)
                    {
                        var startNodes = connection.Query<string>(
                            @"SELECT NodeId FROM Nodes 
                              WHERE BotId = @botId 
                              AND JSON_EXTRACT(Definition, '$.type') = 'start'",
                            new { botId }
                        ).ToList();

                        startNodeIds.AddRange(startNodes);
                    }
                }

                Console.WriteLine($"Found {startNodeIds.Count} start nodes from {validBotIds.Count} bots with satisfied conditions");
                return startNodeIds;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CheckRunCondition: {ex.Message}");
                return new List<string>();
            }
        }
    }
}