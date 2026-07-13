@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.2.0
@REM
@REM Required ENV vars:
@REM JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars
@REM MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the batch commands
@REM MAVEN_BATCH_PAUSE - set to 'on' to pause the script before proceeding
@REM MAVEN_OPTS - parameters passed to the Java VM when running Maven
@REM     e.g. to debug Maven itself, use
@REM set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
@REM MAVEN_SKIP_RC - flag to disable loading of mavenrc files
@REM ----------------------------------------------------------------------------

@IF "%MAVEN_BATCH_ECHO%" == "on"  ECHO ON

@REM Set JAVA_HOME to JDK 17+ if not set
@IF NOT DEFINED JAVA_HOME SET "JAVA_HOME=C:\Program Files\Java\jdk-26.0.1"

@SET MAVEN_PROJECTBASEDIR=%~dp0
@SET MVNW_REPOURL=https://repo.maven.apache.org/maven2
@SET MVNW_VERBOSE=false

@IF EXIST "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6-bin\*\apache-maven-3.9.6\bin\mvn.cmd" GOTO found_maven

@ECHO Downloading Maven...
@POWERSHELL -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $wrapperDir = '%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6-bin'; if (-not (Test-Path $wrapperDir)) { New-Item -ItemType Directory -Force -Path $wrapperDir | Out-Null }; $zipFile = \"$wrapperDir\apache-maven-3.9.6-bin.zip\"; if (-not (Test-Path $zipFile)) { Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip' -OutFile $zipFile }; Expand-Archive -Force -Path $zipFile -DestinationPath $wrapperDir"

:found_maven
@FOR /D %%d IN ("%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6-bin\*\apache-maven-3.9.6") DO SET "MVN_HOME=%%d"
@"%MVN_HOME%\bin\mvn.cmd" %*
