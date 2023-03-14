IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users
(

    Id        nvarchar(450) NOT NULL,
    Email     nvarchar(450) NOT NULL,
    UserName  nvarchar(450) NOT NULL,
    Password  nvarchar(max) NOT NULL,
    FirstName nvarchar(max) NOT NULL,
    LastName  nvarchar(max) NOT NULL,
    PRIMARY KEY (ID)
)
CREATE UNIQUE INDEX IX_Users_Email ON dbo.Users (Email);
CREATE UNIQUE INDEX IX_Users_UserName ON dbo.Users (UserName);

CREATE TABLE Logins
(
    Id             int IDENTITY (1,1) NOT NULL,
    UserId         nvarchar(450)      NOT NULL,
    ExpirationDate DATETIME2          NOT NULL,
    Ended          Bit                NOT NULL DEFAULT (0),
    DeviceId       nvarchar(450)      NOT NULL,
    CONSTRAINT PK_Id PRIMARY KEY (Id),
    CONSTRAINT FK_Login_User FOREIGN KEY (UserId)
        REFERENCES Users (Id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
)
CREATE UNIQUE INDEX IX_Logins_DeviceId ON dbo.Logins (DeviceId);

