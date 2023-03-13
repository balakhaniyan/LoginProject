CREATE TABLE LoginsTemp
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