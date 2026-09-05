BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AnalyticsSummary] (
    [id] INT NOT NULL CONSTRAINT [AnalyticsSummary_id_df] DEFAULT 1,
    [totalReach] INT NOT NULL CONSTRAINT [AnalyticsSummary_totalReach_df] DEFAULT 0,
    [reachPerDevice] INT NOT NULL CONSTRAINT [AnalyticsSummary_reachPerDevice_df] DEFAULT 0,
    [totalProjectViews] INT NOT NULL CONSTRAINT [AnalyticsSummary_totalProjectViews_df] DEFAULT 0,
    [totalSocialClicks] INT NOT NULL CONSTRAINT [AnalyticsSummary_totalSocialClicks_df] DEFAULT 0,
    CONSTRAINT [AnalyticsSummary_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AnalyticsDaily] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATE NOT NULL,
    [total] INT NOT NULL CONSTRAINT [AnalyticsDaily_total_df] DEFAULT 0,
    [unique] INT NOT NULL CONSTRAINT [AnalyticsDaily_unique_df] DEFAULT 0,
    [projectViews] INT NOT NULL CONSTRAINT [AnalyticsDaily_projectViews_df] DEFAULT 0,
    [socialClicks] INT NOT NULL CONSTRAINT [AnalyticsDaily_socialClicks_df] DEFAULT 0,
    CONSTRAINT [AnalyticsDaily_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AnalyticsDaily_date_key] UNIQUE NONCLUSTERED ([date])
);

-- CreateTable
CREATE TABLE [dbo].[TrackingLink] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [forField] NVARCHAR(1000) NOT NULL,
    [interviewer] BIT NOT NULL CONSTRAINT [TrackingLink_interviewer_df] DEFAULT 0,
    [views] INT NOT NULL CONSTRAINT [TrackingLink_views_df] DEFAULT 0,
    [totalSessionSeconds] INT NOT NULL CONSTRAINT [TrackingLink_totalSessionSeconds_df] DEFAULT 0,
    [stackSeconds] INT NOT NULL CONSTRAINT [TrackingLink_stackSeconds_df] DEFAULT 0,
    [contactOpens] INT NOT NULL CONSTRAINT [TrackingLink_contactOpens_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TrackingLink_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TrackingLink_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TrackingLink_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[LinkProjectStat] (
    [id] INT NOT NULL IDENTITY(1,1),
    [linkId] INT NOT NULL,
    [projectId] INT NOT NULL,
    [seconds] INT NOT NULL CONSTRAINT [LinkProjectStat_seconds_df] DEFAULT 0,
    [views] INT NOT NULL CONSTRAINT [LinkProjectStat_views_df] DEFAULT 0,
    CONSTRAINT [LinkProjectStat_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LinkProjectStat_linkId_projectId_key] UNIQUE NONCLUSTERED ([linkId],[projectId])
);

-- CreateTable
CREATE TABLE [dbo].[LinkSocialStat] (
    [id] INT NOT NULL IDENTITY(1,1),
    [linkId] INT NOT NULL,
    [platform] NVARCHAR(1000) NOT NULL,
    [seconds] INT NOT NULL CONSTRAINT [LinkSocialStat_seconds_df] DEFAULT 0,
    [views] INT NOT NULL CONSTRAINT [LinkSocialStat_views_df] DEFAULT 0,
    CONSTRAINT [LinkSocialStat_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [LinkSocialStat_linkId_platform_key] UNIQUE NONCLUSTERED ([linkId],[platform])
);

-- CreateTable
CREATE TABLE [dbo].[Meeting] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATE NOT NULL,
    [time] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [reason] NVARCHAR(1000),
    [meetingLink] NVARCHAR(1000),
    [googleEventId] NVARCHAR(1000),
    [userTimezone] FLOAT(53),
    [userLocalTime] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Meeting_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Meeting_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Meeting_date_time_key] UNIQUE NONCLUSTERED ([date],[time])
);

-- CreateTable
CREATE TABLE [dbo].[ContactMessage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [number] NVARCHAR(1000),
    [whatsapp] BIT NOT NULL CONSTRAINT [ContactMessage_whatsapp_df] DEFAULT 0,
    [filesAttached] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ContactMessage_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ContactMessage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SocialClick] (
    [id] INT NOT NULL IDENTITY(1,1),
    [platform] NVARCHAR(1000) NOT NULL,
    [clickedAt] DATETIME2 NOT NULL CONSTRAINT [SocialClick_clickedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [durationSeconds] FLOAT(53),
    CONSTRAINT [SocialClick_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Meeting_date_idx] ON [dbo].[Meeting]([date]);

-- AddForeignKey
ALTER TABLE [dbo].[LinkProjectStat] ADD CONSTRAINT [LinkProjectStat_linkId_fkey] FOREIGN KEY ([linkId]) REFERENCES [dbo].[TrackingLink]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LinkProjectStat] ADD CONSTRAINT [LinkProjectStat_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LinkSocialStat] ADD CONSTRAINT [LinkSocialStat_linkId_fkey] FOREIGN KEY ([linkId]) REFERENCES [dbo].[TrackingLink]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
