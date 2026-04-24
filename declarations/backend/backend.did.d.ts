import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileReference { 'hash' : string, 'path' : string }
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getAcceptedSuggestions' : ActorMethod<[], Array<[string, string]>>,
  'getAgentResults' : ActorMethod<[], Array<[Principal, string]>>,
  'getApiKey' : ActorMethod<[], [] | [string]>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getCoverLetterFeedbackSessions' : ActorMethod<[], Array<[string, string]>>,
  'getCoverLetters' : ActorMethod<[], Array<[string, string]>>,
  'getExportNotes' : ActorMethod<[], Array<[string, string]>>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getFlashcardSets' : ActorMethod<[], Array<[string, string]>>,
  'getInterviewFeedback' : ActorMethod<[], Array<[string, string]>>,
  'getResumeProfiles' : ActorMethod<[], Array<[string, string]>>,
  'getUserNotes' : ActorMethod<[], Array<[string, string]>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'getWorkflowState' : ActorMethod<[], [] | [string]>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'saveAcceptedSuggestion' : ActorMethod<[string, string], undefined>,
  'saveAgentResult' : ActorMethod<[string, string], undefined>,
  'saveApiKey' : ActorMethod<[string], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'saveCoverLetter' : ActorMethod<[string, string], undefined>,
  'saveCoverLetterFeedbackSession' : ActorMethod<[string, string], undefined>,
  'saveExportNote' : ActorMethod<[string, string], undefined>,
  'saveFlashcardSet' : ActorMethod<[string, string], undefined>,
  'saveResumeProfile' : ActorMethod<[string, string], undefined>,
  'saveWorkflowState' : ActorMethod<[string], undefined>,
  'submitInterviewFeedback' : ActorMethod<[string, string], undefined>,
  'submitUserNote' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
