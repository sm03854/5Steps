-- #################### DATABASE INITIALISATION ####################

DROP DATABASE IF EXISTS five_steps_db;
CREATE DATABASE five_steps_db;
USE five_steps_db;





-- #################### TABLE CREATION ####################

CREATE TABLE Timetables
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	CurrentMonth		INT UNSIGNED NOT NULL,
	CurrentYear			INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID)
);

CREATE TABLE PrayerTimes
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	Timetable_ID		INT UNSIGNED NOT NULL,
	Prayer				ENUM("Fajr", "Zuhr", "Asr", "Maghrib", "Isha") NOT NULL,
	CurrentDay			INT UNSIGNED NOT NULL,
	StartTime			TIME NOT NULL,
	AdhanTime			TIME NOT NULL,
	IqamahTime			TIME NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (Timetable_ID) REFERENCES Timetables(ID) ON DELETE CASCADE
);

CREATE TABLE ExtraTimes
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	Timetable_ID		INT UNSIGNED NOT NULL,
	Extra				ENUM("Sunrise") NOT NULL,
	CurrentDay			INT UNSIGNED NOT NULL,
	CurrentTime			TIME NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (Timetable_ID) REFERENCES Timetables(ID) ON DELETE CASCADE
);



CREATE TABLE MasjidStatistics
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,

	PRIMARY KEY (ID)
);

CREATE TABLE DailyMasjidStatistics
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	CurrentDate			DATE NOT NULL,
	Statistics_ID		INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (Statistics_ID) REFERENCES MasjidStatistics(ID) ON DELETE CASCADE
);

CREATE TABLE PrayerMasjidStatistics
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	Statistics_ID		INT UNSIGNED NOT NULL,
	Prayer				ENUM("Fajr", "Zuhr", "Asr", "Maghrib", "Isha") NOT NULL,
	Attendees			INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (Statistics_ID) REFERENCES DailyMasjidStatistics(ID) ON DELETE CASCADE
);



CREATE TABLE UserStatistics
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,

	PRIMARY KEY (ID)
);

CREATE TABLE DailyUserStatistics
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	CurrentDate			DATE NOT NULL,
	Statistics_ID		INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (Statistics_ID) REFERENCES UserStatistics(ID) ON DELETE CASCADE
);

CREATE TABLE PrayerUserStatistics
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	Statistics_ID		INT UNSIGNED NOT NULL,
	Prayer				ENUM("Fajr", "Zuhr", "Asr", "Maghrib", "Isha") NOT NULL,
	Attended			BOOLEAN NOT NULL,
	Steps				INT UNSIGNED NOT NULL DEFAULT 0,

	PRIMARY KEY (ID),
	FOREIGN KEY (Statistics_ID) REFERENCES DailyUserStatistics(ID) ON DELETE CASCADE
);



CREATE TABLE Trusts
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	FullName      		VARCHAR(255) NOT NULL,

	PRIMARY KEY (ID)
);

CREATE TABLE Masjids
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	FullName      		VARCHAR(255) NOT NULL,
	Postcode            VARCHAR(255) UNIQUE NOT NULL,
	AddressLine         VARCHAR(255) UNIQUE NOT NULL,
	Email       		VARCHAR(255) UNIQUE NOT NULL,
	Latitude			DECIMAL(12, 8) NOT NULL,
	Longitude			DECIMAL(12, 8) NOT NULL,
	Trust_ID			INT UNSIGNED NOT NULL,
	Statistics_ID		INT UNSIGNED NOT NULL,
	Timetable_ID		INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (Trust_ID) REFERENCES Trusts(ID) ON DELETE RESTRICT,
	FOREIGN KEY (Statistics_ID) REFERENCES MasjidStatistics(ID) ON DELETE RESTRICT,
	FOREIGN KEY (Timetable_ID) REFERENCES Timetables(ID) ON DELETE RESTRICT
);



CREATE TABLE Users
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	FirstName      		VARCHAR(255) NOT NULL,
	LastName			VARCHAR(255) NOT NULL,
	DOB            		DATE NOT NULL,
	Gender         		ENUM ("Male", "Female") NOT NULL,
	Email       		VARCHAR(255) UNIQUE NOT NULL,
	PasswordHash   		VARCHAR(255) NOT NULL,
	Permission      	ENUM ("Member", "Trustee", "Admin") NOT NULL DEFAULT "Member",

	PRIMARY KEY (ID)
);

CREATE TABLE Members
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	Masjid_ID			INT UNSIGNED NOT NULL,
	Statistics_ID		INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (ID) REFERENCES Users(ID) ON DELETE CASCADE,
	FOREIGN KEY (Masjid_ID) REFERENCES Masjids(ID) ON DELETE RESTRICT,
	FOREIGN KEY (Statistics_ID) REFERENCES UserStatistics(ID) ON DELETE RESTRICT
);

CREATE TABLE Trustees
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,
	Trust_ID			INT UNSIGNED NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (ID) REFERENCES Users(ID) ON DELETE CASCADE,
	FOREIGN KEY (Trust_ID) REFERENCES Trusts(ID) ON DELETE RESTRICT
);

CREATE TABLE Admins
(
	ID	          		INT UNSIGNED AUTO_INCREMENT NOT NULL,

	PRIMARY KEY (ID),
	FOREIGN KEY (ID) REFERENCES Users(ID) ON DELETE CASCADE
);





-- #################### USER DATA INSERTION ####################

INSERT INTO Timetables VALUES
(1001, 6, 2025);

INSERT INTO PrayerTimes VALUES
(1000001, 1001, "Fajr", 1, "02:59:00", "03:45:00", "04:00:00"),
(1000002, 1001, "Zuhr", 1, "13:07:00", "13:15:00", "13:30:00"),
(1000003, 1001, "Asr", 1, "18:34:00", "19:15:00", "19:30:00"),
(1000004, 1001, "Maghrib", 1, "21:14:00", "21:14:00", "21:14:00"),
(1000005, 1001, "Isha", 1, "22:18:00", "22:25:00", "22:40:00");

INSERT INTO ExtraTimes VALUES
(1000001, 1001, "Sunrise", 1, "04:53:00");



INSERT INTO MasjidStatistics VALUES
(1001);

INSERT INTO DailyMasjidStatistics VALUES
(1000001, "2025-06-01", 1001);

INSERT INTO PrayerMasjidStatistics VALUES
(1000001, 1000001, "Fajr", 20),
(1000002, 1000001, "Zuhr", 110),
(1000003, 1000001, "Asr", 60),
(1000004, 1000001, "Maghrib", 100),
(1000005, 1000001, "Isha", 80);



INSERT INTO UserStatistics VALUES
(1001);

INSERT INTO DailyUserStatistics VALUES
(1000001, "2025-06-01", 1001);

INSERT INTO PrayerUserStatistics VALUES
(1000001, 1000001, "Fajr", FALSE, 0),
(1000002, 1000001, "Zuhr", TRUE, 1000),
(1000003, 1000001, "Asr", TRUE, 1100),
(1000004, 1000001, "Maghrib", TRUE, 800),
(1000005, 1000001, "Isha", TRUE, 1800);



INSERT INTO Trusts VALUES
(1001, "Abu Bakr Masjid Trust");

INSERT INTO Masjids VALUES
(1001, "Abu Bakr Masjid", "RG30 1AF", "330 Oxford Rd, Reading", "info@abmreading.org", 51.457009, -0.996256, 1001, 1001, 1001);



INSERT INTO Users VALUES
(1000001, "Abdullah", "Ahmad", "2013-01-30", "Male", "abdAhmad@gmail.com", "$argon2id$v=19$m=65536,t=3,p=4$o391F76OPjYt1vSXhBA0uA$B20ONx7kXwqX1SlfWs66pq9jT1D/rxDX6s12feK0YL4", "Member"),
(1000002, "Khalid", "Mahmood", "1974-04-17", "Male", "khalidM@gmail.com", "$argon2id$v=19$m=65536,t=3,p=4$o391F76OPjYt1vSXhBA0uA$B20ONx7kXwqX1SlfWs66pq9jT1D/rxDX6s12feK0YL4", "Trustee"),
(1000003, "Saifur-Rahman", "Mohammed", "2005-04-13", "Male", "saifM@gmail.com", "$argon2id$v=19$m=65536,t=3,p=4$o391F76OPjYt1vSXhBA0uA$B20ONx7kXwqX1SlfWs66pq9jT1D/rxDX6s12feK0YL4", "Admin");
-- "$argon2id$v=19$m=65536,t=3,p=4$o391F76OPjYt1vSXhBA0uA$B20ONx7kXwqX1SlfWs66pq9jT1D/rxDX6s12feK0YL4" is the hash for "password"

INSERT INTO Members VALUES
(1000001, 1001, 1001);

INSERT INTO Trustees VALUES
(1000002, 1001);

INSERT INTO Admins VALUES
(1000003);




