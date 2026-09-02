BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [liveLink] NVARCHAR(1000),
    [repoLink] NVARCHAR(1000),
    [downloadLink] NVARCHAR(1000),
    [iconUrl] NVARCHAR(1000),
    [viewsProject] INT NOT NULL CONSTRAINT [Project_viewsProject_df] DEFAULT 0,
    [viewsGithub] INT NOT NULL CONSTRAINT [Project_viewsGithub_df] DEFAULT 0,
    [viewsLive] INT NOT NULL CONSTRAINT [Project_viewsLive_df] DEFAULT 0,
    [viewsDownload] INT NOT NULL CONSTRAINT [Project_viewsDownload_df] DEFAULT 0,
    [listing] INT NOT NULL CONSTRAINT [Project_listing_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Project_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Project_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectImage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [projectId] INT NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [ProjectImage_sortOrder_df] DEFAULT 0,
    CONSTRAINT [ProjectImage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(1000) NOT NULL,
    [iconUrl] NVARCHAR(1000),
    CONSTRAINT [Tag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tag_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectTag] (
    [projectId] INT NOT NULL,
    [tagId] INT NOT NULL,
    CONSTRAINT [ProjectTag_pkey] PRIMARY KEY CLUSTERED ([projectId],[tagId])
);

-- CreateTable
CREATE TABLE [dbo].[Contributor] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000),
    [imageUrl] NVARCHAR(1000),
    [github] NVARCHAR(1000),
    [linkedin] NVARCHAR(1000),
    [facebook] NVARCHAR(1000),
    [instagram] NVARCHAR(1000),
    [portfolio] NVARCHAR(1000),
    CONSTRAINT [Contributor_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectContributor] (
    [projectId] INT NOT NULL,
    [contributorId] INT NOT NULL,
    [roleAtProject] NVARCHAR(1000),
    CONSTRAINT [ProjectContributor_pkey] PRIMARY KEY CLUSTERED ([projectId],[contributorId])
);

-- CreateTable
CREATE TABLE [dbo].[TechStackItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [iconUrl] NVARCHAR(1000) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [TechStackItem_sortOrder_df] DEFAULT 0,
    CONSTRAINT [TechStackItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HandlingProject] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [HandlingProject_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SocialLink] (
    [id] INT NOT NULL IDENTITY(1,1),
    [platform] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [SocialLink_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SettingsAccount] (
    [id] INT NOT NULL CONSTRAINT [SettingsAccount_id_df] DEFAULT 1,
    [name] NVARCHAR(1000),
    [title] NVARCHAR(1000),
    [heroImageUrl] NVARCHAR(1000),
    [imageUrl] NVARCHAR(1000),
    CONSTRAINT [SettingsAccount_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SettingsAvailability] (
    [id] INT NOT NULL CONSTRAINT [SettingsAvailability_id_df] DEFAULT 1,
    [availabilityPercent] INT NOT NULL CONSTRAINT [SettingsAvailability_availabilityPercent_df] DEFAULT 0,
    [timezoneOffset] FLOAT(53) NOT NULL CONSTRAINT [SettingsAvailability_timezoneOffset_df] DEFAULT 0,
    CONSTRAINT [SettingsAvailability_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ProjectImage] ADD CONSTRAINT [ProjectImage_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectTag] ADD CONSTRAINT [ProjectTag_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectTag] ADD CONSTRAINT [ProjectTag_tagId_fkey] FOREIGN KEY ([tagId]) REFERENCES [dbo].[Tag]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectContributor] ADD CONSTRAINT [ProjectContributor_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectContributor] ADD CONSTRAINT [ProjectContributor_contributorId_fkey] FOREIGN KEY ([contributorId]) REFERENCES [dbo].[Contributor]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
