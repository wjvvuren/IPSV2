using MySqlConnector;

namespace IpsApi.Services;

/// <summary>
/// Provides MySQL database connectivity using .env configuration.
/// All database access in the application flows through this service.
/// </summary>
public class DatabaseService
{
    private readonly string _connectionString;

    public DatabaseService()
    {
        var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
        var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
        var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "Bank01";
        var user = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
        var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "";

        _connectionString = $"Server={host};Port={port};Database={database};User={user};Password={password};";
    }

    /// <summary>
    /// Creates and opens a new MySQL connection.
    /// </summary>
    public async Task<MySqlConnection> GetConnectionAsync()
    {
        var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync();
        return connection;
    }

    /// <summary>
    /// Calls a stored procedure and returns the result as a list of dictionaries.
    /// Each dictionary represents a row with column names as keys.
    /// This supports dynamic column structures from procedures like ReadNewERM.
    /// Uses raw CALL syntax to handle NULL parameters correctly with MySQL.
    /// </summary>
    public async Task<List<Dictionary<string, object?>>> CallProcedureAsync(
        string procedureName,
        Dictionary<string, object?> parameters)
    {
        await using var connection = await GetConnectionAsync();

        // Build CALL statement with indexed params to avoid MySQL NULL handling issues
        var paramPlaceholders = new List<string>();
        var command = new MySqlCommand { Connection = connection };
        int idx = 0;

        foreach (var param in parameters)
        {
            var paramName = $"@p{idx}";
            paramPlaceholders.Add(paramName);

            if (param.Value is null || param.Value == DBNull.Value)
            {
                // For NULL values, embed directly to avoid MySQL param binding issues
                paramPlaceholders[idx] = "NULL";
            }
            else
            {
                command.Parameters.AddWithValue(paramName, param.Value);
            }
            idx++;
        }

        command.CommandText = $"CALL `{procedureName}`({string.Join(", ", paramPlaceholders)})";

        var results = new List<Dictionary<string, object?>>();
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                var value = reader.GetValue(i);
                row[reader.GetName(i)] = value == DBNull.Value ? null : value;
            }
            results.Add(row);
        }

        return results;
    }
}
