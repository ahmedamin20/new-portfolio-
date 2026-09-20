BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AdminCredential] (
    [id] INT NOT NULL CONSTRAINT [AdminCredential_id_df] DEFAULT 1,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [resetTokenHash] NVARCHAR(1000),
    [resetTokenExpiresAt] DATETIME2,
    CONSTRAINT [AdminCredential_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
