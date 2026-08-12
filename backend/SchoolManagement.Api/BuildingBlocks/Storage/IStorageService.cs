namespace SchoolManagement.Api.BuildingBlocks.Storage;

public interface IStorageService
{
    Task<StorageUploadResult> UploadPdfAsync(Stream fileStream, string originalFileName, long fileSize);
    Task DeleteFileAsync(string fileKey);
    string GetPublicUrl(string fileKey);
}

public record StorageUploadResult(string FileUrl, string FileKey, string FileName, long FileSize);
