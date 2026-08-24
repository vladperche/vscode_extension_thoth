import * as vscode from 'vscode';

class EnvironmentStateService {
  private documentEnvMap = new Map<string, string>();

  public getSelectedEnvironment(documentUri: vscode.Uri): string {
    return this.documentEnvMap.get(documentUri.toString()) || '$shared';
  }

  public setSelectedEnvironment(documentUri: vscode.Uri, envName: string): void {
    this.documentEnvMap.set(documentUri.toString(), envName || '$shared');
  }

  public clearEnvironment(documentUri: vscode.Uri): void {
    this.documentEnvMap.delete(documentUri.toString());
  }
}

export const envStateService = new EnvironmentStateService();
