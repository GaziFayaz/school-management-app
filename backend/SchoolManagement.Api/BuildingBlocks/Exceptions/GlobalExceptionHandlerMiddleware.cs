using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SchoolManagement.Api.BuildingBlocks.Exceptions;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred while processing request {Path}", context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogWarning("The response has already started, the global exception handler will not execute.");
            return;
        }

        var statusCode = HttpStatusCode.InternalServerError;
        var title = "An unexpected server error occurred.";
        var message = "An error occurred while processing your request. Please try again later.";

        switch (exception)
        {
            case ArgumentException or BadHttpRequestException:
                statusCode = HttpStatusCode.BadRequest;
                title = "Invalid Request";
                message = exception.Message;
                break;

            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                title = "Unauthorized";
                message = exception.Message;
                break;

            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                title = "Resource Not Found";
                message = exception.Message;
                break;

            case DbUpdateException dbEx:
                statusCode = HttpStatusCode.Conflict;
                title = "Database Constraint Conflict";
                message = "A database constraint was violated (e.g. duplicate key or dependent entity constraint).";
                break;

            case InvalidOperationException invEx when invEx.Message.Contains("Sequence contains no elements"):
                statusCode = HttpStatusCode.NotFound;
                title = "Resource Not Found";
                message = "The requested entity could not be found.";
                break;

            default:
                statusCode = HttpStatusCode.InternalServerError;
                title = "Internal Server Error";
                message = _env.IsDevelopment() ? exception.Message : "An unexpected internal server error occurred.";
                break;
        }

        context.Response.Clear();
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = message,
            Instance = context.Request.Path
        };

        if (_env.IsDevelopment())
        {
            problemDetails.Extensions["stackTrace"] = exception.StackTrace;
            problemDetails.Extensions["exceptionType"] = exception.GetType().Name;
        }

        problemDetails.Extensions["traceId"] = context.TraceIdentifier;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        var responseBody = JsonSerializer.Serialize(new
        {
            status = problemDetails.Status,
            title = problemDetails.Title,
            message = problemDetails.Detail,
            traceId = context.TraceIdentifier,
            detail = _env.IsDevelopment() ? exception.ToString() : null
        }, jsonOptions);

        await context.Response.WriteAsync(responseBody);
    }
}
