using Amazon.S3;
using Amazon.S3.Model;

namespace SchoolManagement.Api.BuildingBlocks.Storage;

public class CloudflareR2StorageOptions
{
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = "school-assignment-submissions";
    public string PublicDomain { get; set; } = "http://localhost:5000/api/submissions/files";
}

public class CloudflareR2StorageService : IStorageService
{
    private readonly CloudflareR2StorageOptions _options;
    private readonly IAmazonS3? _s3Client;
    private readonly IWebHostEnvironment _env;

    public CloudflareR2StorageService(IConfiguration config, IWebHostEnvironment env)
    {
        _env = env;
        _options = new CloudflareR2StorageOptions();
        config.GetSection("CloudflareR2").Bind(_options);

        if (!string.IsNullOrEmpty(_options.ServiceUrl) &&
            !string.IsNullOrEmpty(_options.AccessKeyId) &&
            !string.IsNullOrEmpty(_options.SecretAccessKey))
        {
            var s3Config = new AmazonS3Config
            {
                ServiceURL = _options.ServiceUrl,
                ForcePathStyle = true
            };
            _s3Client = new AmazonS3Client(_options.AccessKeyId, _options.SecretAccessKey, s3Config);
        }
    }

    public async Task<StorageUploadResult> UploadPdfAsync(Stream fileStream, string originalFileName, long fileSize)
    {
        var fileExtension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (fileExtension != ".pdf")
        {
            throw new ArgumentException("Only PDF files (.pdf) are allowed.");
        }

        if (fileSize > 10 * 1024 * 1024) // 10MB
        {
            throw new ArgumentException("File size exceeds maximum limit of 10 MB.");
        }

        var uniqueKey = $"submissions/{Guid.NewGuid()}{fileExtension}";

        if (_s3Client != null)
        {
            var putRequest = new PutObjectRequest
            {
                BucketName = _options.BucketName,
                Key = uniqueKey,
                InputStream = fileStream,
                ContentType = "application/pdf",
                DisablePayloadSigning = true,
                DisableDefaultChecksumValidation = true
            };
            await _s3Client.PutObjectAsync(putRequest);
        }
        else
        {
            // Local fallback storage for development when R2 keys are not supplied
            var localStorageDir = Path.Combine(_env.ContentRootPath, "StorageUploads", "submissions");
            Directory.CreateDirectory(localStorageDir);
            var localPath = Path.Combine(_env.ContentRootPath, "StorageUploads", uniqueKey);
            Directory.CreateDirectory(Path.GetDirectoryName(localPath)!);

            using var targetStream = File.Create(localPath);
            await fileStream.CopyToAsync(targetStream);
        }

        var publicUrl = GetPublicUrl(uniqueKey);
        return new StorageUploadResult(publicUrl, uniqueKey, originalFileName, fileSize);
    }

    public async Task<StorageFileResult?> GetFileStreamAsync(string fileKey)
    {
        if (_s3Client != null)
        {
            try
            {
                var getRequest = new GetObjectRequest
                {
                    BucketName = _options.BucketName,
                    Key = fileKey
                };
                var response = await _s3Client.GetObjectAsync(getRequest);
                var contentType = !string.IsNullOrEmpty(response.Headers.ContentType)
                    ? response.Headers.ContentType
                    : "application/pdf";
                return new StorageFileResult(response.ResponseStream, contentType);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound || ex.ErrorCode == "NoSuchKey")
            {
                // Fallback to check local disk in case the file was uploaded locally prior to enabling R2
                var fallbackPath = Path.Combine(_env.ContentRootPath, "StorageUploads", fileKey);
                if (File.Exists(fallbackPath))
                {
                    var fallbackStream = new FileStream(fallbackPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                    return new StorageFileResult(fallbackStream, "application/pdf");
                }
                return null;
            }
        }
        else
        {
            var localPath = Path.Combine(_env.ContentRootPath, "StorageUploads", fileKey);
            if (File.Exists(localPath))
            {
                var stream = new FileStream(localPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                return new StorageFileResult(stream, "application/pdf");
            }
            return null;
        }
    }

    public async Task DeleteFileAsync(string fileKey)
    {
        if (_s3Client != null)
        {
            try
            {
                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = _options.BucketName,
                    Key = fileKey
                };
                await _s3Client.DeleteObjectAsync(deleteRequest);
            }
            catch
            {
                // Ignore remote deletion errors if object does not exist
            }
        }

        var localPath = Path.Combine(_env.ContentRootPath, "StorageUploads", fileKey);
        if (File.Exists(localPath))
        {
            try
            {
                File.Delete(localPath);
            }
            catch
            {
                // Ignore local file deletion errors
            }
        }
    }

    public string GetPublicUrl(string fileKey)
    {
        return $"/api/student/submissions/file?key={Uri.EscapeDataString(fileKey)}";
    }
}

