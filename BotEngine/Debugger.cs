using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Data.Sqlite;
using Dapper;
using System.Net;
using System.Net.Sockets;
using Microsoft.VisualBasic;
using Newtonsoft.Json;
using System.Threading.Tasks;

namespace BotEngine
{
    public class Debugger
    {
        public TcpListener listener = new TcpListener(IPAddress.Any, 5001);
        public TcpClient? client { get; set; }
        public StreamReader? reader { get; set; }
        public StreamWriter? writer { get; set; }
        
        public Debugger()
        {
            Console.WriteLine("Starting debugger...");
            listener.Start();
        }

        public async Task StartSocketServer()
        {
            Console.WriteLine("Debugger socket server started, waiting for frontend client...");
            while (true)
            {
                client = await listener.AcceptTcpClientAsync();
                var stream = client.GetStream();
                reader = new StreamReader(stream);
                writer = new StreamWriter(stream) { AutoFlush = true };

                Console.WriteLine("Frontend client connected to debugger");

                try
                {
                    // Handle incoming messages from the frontend
                    while (client.Connected)
                    {
                        Console.WriteLine("Waiting for messages from frontend...");
                        var line = await reader.ReadLineAsync();
                        if (line == null) break;

                        Console.WriteLine($"Received from frontend: {line}");
                        await HandleFrontendMessage(line);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in socket server: {ex.Message}");
                }
                finally
                {
                    client?.Close();
                    Console.WriteLine("Frontend client disconnected");
                }
            }
        }

        private async Task HandleFrontendMessage(string message)
        {
            try
            {
                Console.WriteLine($"Handling frontend message: {message}");
                var debugCommand = JsonConvert.DeserializeObject<DebugCommand>(message);
                if (debugCommand == null) return;

                switch (debugCommand.Command)
                {
                    case "start":
                        await HandleStartCommand(debugCommand);
                        break;
                    case "stop":
                        await HandleStopCommand();
                        break;
                    default:
                        Console.WriteLine($"Unknown debug command: {debugCommand.Command}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling frontend message: {ex.Message}");
                await SendDebugMessage("error", new { error = ex.Message });
            }
        }

        private async Task HandleStartCommand(DebugCommand command)
        {
            try
            {
                var startNodeId = command.StartNodeId;
                var botId = command.BotId;

                if (string.IsNullOrEmpty(startNodeId) || string.IsNullOrEmpty(botId))
                {
                    await SendDebugMessage("error", new { error = "StartNodeId and BotId are required" });
                    return;
                }

                Console.WriteLine($"Starting bot execution for botId: {botId}, startNode: {startNodeId}");

                // Create and run the bot
                Bot bot = new Bot(startNodeId, this);
                var result = await bot.Run(startNodeId);

                // Send completion message
                await SendDebugMessage("execution_complete", new { result });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in start command: {ex.Message}");
                await SendDebugMessage("execution_error", new { error = ex.Message });
            }
        }

        private async Task HandleStopCommand()
        {
            Console.WriteLine("Stop command received");
            await SendDebugMessage("execution_stopped", new { });
        }

        public async Task SendNodeStart(string nodeId)
        {
            await SendDebugMessage("node_start", new { nodeId });
        }

        public async Task SendNodeComplete(string nodeId, object result)
        {
            await SendDebugMessage("node_complete", new { nodeId, result });
        }

        public async Task SendNodeError(string nodeId, string error)
        {
            await SendDebugMessage("node_error", new { nodeId, error });
        }

        private async Task SendDebugMessage(string type, object data)
        {
            if (writer == null) return;

            try
            {
                var message = new
                {
                    type,
                    timestamp = DateTime.UtcNow.ToString("o"),
                    data
                };

                var json = JsonConvert.SerializeObject(message);
                await writer.WriteLineAsync(json);
                Console.WriteLine($"Sent debug message: {type}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending debug message: {ex.Message}");
            }
        }
    }

    public class DebugCommand
    {
        public string Command { get; set; } = "";
        public string? StartNodeId { get; set; }
        public string? BotId { get; set; }
    }
}