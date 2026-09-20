BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ExperienceEntry] (
    [id] INT NOT NULL IDENTITY(1,1),
    [role] NVARCHAR(1000) NOT NULL,
    [company] NVARCHAR(1000) NOT NULL,
    [period] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [sortOrder] INT NOT NULL CONSTRAINT [ExperienceEntry_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ExperienceEntry_pkey] PRIMARY KEY CLUSTERED ([id])
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
