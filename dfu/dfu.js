async function dfu() {
	if (charDfu != null) {

		let buffer = new ArrayBuffer(1);
		let uint8View = new Uint8Array(buffer);
		uint8View[0] = 1;
		await charDfu.writeValue(uint8View);

		const response = await fetch("FW/app_dfu_package.zip");
		const myBlob = await response.blob();

		setPackage(myBlob);
		selectDevice();
	}
}

function setStatus(state) {
	console.log(state);
}

function setTransfer(state) {
	if (!state) {
		return;
	}
}

// Load a firmware package
function setPackage(file) {
	if (!file)
		return;

	package = new SecureDfuPackage(file);
	package.load()
	.then(() => {
		setStatus(`Firmware package: ${file.name}`);
	})
	.catch (error => {
		setStatus(error);
	});
}

// Choose a device
function selectDevice() {
	setStatus("Selecting device...");
	setTransfer();

	const dfu = new SecureDfu(CRC32.buf);
	dfu.addEventListener("log", event => {
		console.log(event.message);
	});
	dfu.addEventListener("progress", event => {
		setTransfer(event);
	});

	dfu.requestDevice(true)
	.then(device => {
		if (!device) {
			setStatus("DFU mode set, select device again");
			return;
		}
		return update(dfu, device);
	})
	.catch (error => {
		setStatus(error);
	});
}

// Update a device with all firmware from a package
function update(dfu, device) {
	if (!package)
		return;

	Promise.resolve()
	.then(() => package.getBaseImage())
	.then(image => {
		if (image) {
			setStatus(`Updating ${image.type}: ${image.imageFile}...`);
			return dfu.update(device, image.initData, image.imageData);
		}
	})
	.then(() => package.getAppImage())
	.then(image => {
		if (image) {
			setStatus(`Updating ${image.type}: ${image.imageFile}...`);
			return dfu.update(device, image.initData, image.imageData);
		}
	})
	.then(() => {
		setStatus("Update complete!");
		setTransfer();
	})
	.catch (error => {
		setStatus(error);
	});
}
