/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string; // in bytes (string format)
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  iconLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  owners?: Array<{
    displayName: string;
    photoLink?: string;
    emailAddress?: string;
  }>;
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export interface UserAuthInfo {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}
