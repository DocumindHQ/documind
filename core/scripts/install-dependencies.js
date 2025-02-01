const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const fs = require("node:fs");

const execPromise = promisify(exec);

const installPackage = async (command, packageName) => {
	try {
		const { stdout, stderr } = await execPromise(command);
		if (stderr) {
			throw new Error(`Failed to install ${packageName}: ${stderr}`);
		}
		return stdout;
	} catch (error) {
		throw new Error(`Failed to install ${packageName}: ${error.message}`);
	}
};

const isSudoAvailable = async () => {
	try {
		// Try running a sudo command (more relevant for Unix-like systems)
		await execPromise("sudo -n true");
		return true;
	} catch {
		return false;
	}
};

const checkInstalled = async (command, appName) => {
	try {
		const { stdout } = await execPromise(command);
		console.log(`${appName} is installed: ${stdout}`);
		return true;
	} catch (error) {
		console.log(`${appName} is not installed. Error: ${error.message}`);
		return false;
	}
};

const checkAndInstall = async () => {
	try {
		const sudoAvailable = await isSudoAvailable();

		// Check for Ghostscript
		const ghostscriptInstalled =
			(await checkInstalled("gswin64c --version", "Ghostscript")) ||
			(await checkInstalled("gswin32c --version", "Ghostscript"));
		if (!ghostscriptInstalled) {
			console.log(
				"Please install Ghostscript from https://www.ghostscript.com/download.html",
			);
		}

		// Check for GraphicsMagick
		const graphicsMagickInstalled = await checkInstalled(
			"gm -version",
			"GraphicsMagick",
		);
		if (!graphicsMagickInstalled) {
			if (process.platform === "darwin") {
				await installPackage("brew install graphicsmagick", "GraphicsMagick");
			} else if (process.platform === "linux") {
				const command = sudoAvailable
					? "sudo apt-get update && sudo apt-get install -y graphicsmagick"
					: "apt-get update && apt-get install -y graphicsmagick";
				await installPackage(command, "GraphicsMagick");
			} else {
				console.log(
					"Please install GraphicsMagick from http://www.graphicsmagick.org/download.html",
				);
			}
		}

		// Check for LibreOffice
		const libreOfficeInstalled = await checkInstalled(
			"soffice --version",
			"LibreOffice",
		);
		if (!libreOfficeInstalled) {
			if (process.platform === "darwin") {
				await installPackage("brew install --cask libreoffice", "LibreOffice");
			} else if (process.platform === "linux") {
				const command = sudoAvailable
					? "sudo apt-get update && sudo apt-get install -y libreoffice"
					: "apt-get update && apt-get install -y libreoffice";
				await installPackage(command, "LibreOffice");
			} else {
				console.log(
					"Please install LibreOffice from https://www.libreoffice.org/download/download",
				);
			}
		}
	} catch (err) {
		console.error(`Error during installation: ${err.message}`);
		process.exit(1);
	}
};

checkAndInstall();
