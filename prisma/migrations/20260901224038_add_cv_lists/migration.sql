BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[EducationEntry] (
    [id] INT NOT NULL IDENTITY(1,1),
    [degree] NVARCHAR(1000) NOT NULL,
    [institution] NVARCHAR(1000) NOT NULL,
    [period] NVARCHAR(1000),
    [sortOrder] INT NOT NULL CONSTRAINT [EducationEntry_sortOrder_df] DEFAULT 0,
    CONSTRAINT [EducationEntry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ImpactEntry] (
    [id] INT NOT NULL IDENTITY(1,1),
    [text] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ImpactEntry_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ImpactEntry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LanguageEntry] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [level] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [LanguageEntry_sortOrder_df] DEFAULT 0,
    CONSTRAINT [LanguageEntry_pkey] PRIMARY KEY CLUSTERED ([id])
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
