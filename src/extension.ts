/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { ProviderResult } from 'vscode';
import { activateSHADERedDebug } from './activateSHADERedDebug';

/*
 * The compile time flag 'runMode' controls how the debug adapter is run.
 * Please note: the test suite only supports 'external' mode.
 */
const runMode: 'external' | 'server' | 'namedPipeServer' | 'inline' = 'external';

export function activate(context: vscode.ExtensionContext) {
	// debug adapters can be run in different ways by using a vscode.DebugAdapterDescriptorFactory:
	switch (runMode) {
		case 'external': default:
			// run the debug adapter as a separate process
			activateSHADERedDebug(context, new DebugAdapterExecutableFactory());
			break;
	}
}

export function deactivate() {
	// nothing to do
}

class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {
	createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): ProviderResult<vscode.DebugAdapterDescriptor> {
		// use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)
		if (!executable) {
			let shaderedPath = vscode.workspace.getConfiguration('shadered').executablePath;
			if (!shaderedPath.trim()) {
				var isWin = require('os').platform().indexOf('win') > -1;
				if (isWin)
					shaderedPath = 'SHADERed.exe';
				else
					shaderedPath = 'shadered';
			}
			
			const command = shaderedPath;
			const args = [
				_session.configuration.program,
				"-m",
				"-dap"
			];
			const options = {
				//cwd: "working directory for executable",
				//env: { "envVariable": "some value" }
			};
			executable = new vscode.DebugAdapterExecutable(command, args, options);
		}

		// make VS Code launch the DA executable
		return executable;
	}
}
