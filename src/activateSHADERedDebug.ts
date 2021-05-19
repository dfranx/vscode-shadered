/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';
import { FileAccessor } from './shaderedRuntime';

export function activateSHADERedDebug(context: vscode.ExtensionContext, factory?: vscode.DebugAdapterDescriptorFactory) {

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.shadered.runEditorContents', (resource: vscode.Uri) => {
			let targetResource = resource;
			if (!targetResource && vscode.window.activeTextEditor) {
				targetResource = vscode.window.activeTextEditor.document.uri;
			}
			if (targetResource) {
				vscode.debug.startDebugging(undefined, {
						type: 'shadered',
						name: 'Run File',
						request: 'launch',
						program: targetResource.fsPath
					},
					{ noDebug: true }
				);
			}
		}),
		vscode.commands.registerCommand('extension.shadered.debugEditorContents', (resource: vscode.Uri) => {
			let targetResource = resource;
			if (!targetResource && vscode.window.activeTextEditor) {
				targetResource = vscode.window.activeTextEditor.document.uri;
			}
			if (targetResource) {
				vscode.debug.startDebugging(undefined, {
					type: 'shadered',
					name: 'Debug File',
					request: 'launch',
					program: targetResource.fsPath
				});
			}
		}),
		vscode.commands.registerCommand('extension.shadered.toggleFormatting', (variable) => {
			const ds = vscode.debug.activeDebugSession;
			if (ds) {
				ds.customRequest('toggleFormatting');
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('extension.shadered.getProgramName', config => {
		return vscode.window.showInputBox({
			placeHolder: "Please enter the name of a SHADERed project file in the workspace folder",
			value: "project.sprj"
		});
	}));

	// register a configuration provider for 'shadered' debug type
	const provider = new SHADERedConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('shadered', provider));

	// register a dynamic configuration provider for 'shadered' debug type
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('shadered', {
		provideDebugConfigurations(folder: WorkspaceFolder | undefined): ProviderResult<DebugConfiguration[]> {
			return [
				{
					name: "Dynamic Launch",
					request: "launch",
					type: "shadered",
					program: "${file}"
				},
				{
					name: "Another Dynamic Launch",
					request: "launch",
					type: "shadered",
					program: "${file}"
				},
				{
					name: "SHADERed Launch",
					request: "launch",
					type: "shadered",
					program: "${file}"
				}
			];
		}
	}, vscode.DebugConfigurationProviderTriggerKind.Dynamic));

	if (factory != undefined) {
		context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('shadered', factory));
		if ('dispose' in factory)
			context.subscriptions.push(factory);
	}
}

class SHADERedConfigurationProvider implements vscode.DebugConfigurationProvider {

	/**
	 * Massage a debug configuration just before a debug session is being launched,
	 * e.g. add all missing attributes to the debug configuration.
	 */
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
		// if launch.json is missing or empty
		if (!config.program) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.fileName.split('.').pop() === 'sprj')
				config.program = '${file}';
		}
		if (!config.stopOnEntry) config.stopOnEntry = false;
		if (!config.type) config.type = 'shadered';
		if (!config.name) config.name = 'Launch';
		if (!config.request) config.request = 'launch';

		if (!config.program) {
			return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
				return undefined;	// abort launch
			});
		}

		return config;
	}
}

export const workspaceFileAccessor: FileAccessor = {
	async readFile(path: string) {
		try {
			const uri = vscode.Uri.file(path);
			const bytes = await vscode.workspace.fs.readFile(uri);
			const contents = Buffer.from(bytes).toString('utf8');
			return contents;
		} catch(e) {
			try {
				const uri = vscode.Uri.parse(path);
				const bytes = await vscode.workspace.fs.readFile(uri);
				const contents = Buffer.from(bytes).toString('utf8');
				return contents;
			} catch (e) {
				return `cannot read '${path}'`;
			}
		}
	}
};
