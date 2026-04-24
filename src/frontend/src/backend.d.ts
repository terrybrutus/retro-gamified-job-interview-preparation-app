import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FileReference {
    hash: string;
    path: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addXP(userId: string, amount: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    getAcceptedSuggestions(): Promise<Array<[string, string]>>;
    getAgentResults(): Promise<Array<[Principal, string]>>;
    getApiKey(): Promise<string | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCareerLevel(userId: string): Promise<bigint>;
    getCoverLetterFeedbackSessions(): Promise<Array<[string, string]>>;
    getCoverLetters(): Promise<Array<[string, string]>>;
    getExportNotes(): Promise<Array<[string, string]>>;
    getFileReference(path: string): Promise<FileReference>;
    getFlashcardSets(): Promise<Array<[string, string]>>;
    getInterviewFeedback(): Promise<Array<[string, string]>>;
    getResumeProfiles(): Promise<Array<[string, string]>>;
    getUserNotes(): Promise<Array<[string, string]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkflowState(): Promise<string | null>;
    getXP(userId: string): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    listFileReferences(): Promise<Array<FileReference>>;
    registerFileReference(path: string, hash: string): Promise<void>;
    saveAcceptedSuggestion(jobId: string, suggestion: string): Promise<void>;
    saveAgentResult(agentId: string, result: string): Promise<void>;
    saveApiKey(apiKey: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCoverLetter(letterId: string, letterContent: string): Promise<void>;
    saveCoverLetterFeedbackSession(sessionId: string, sessionData: string): Promise<void>;
    saveExportNote(noteId: string, noteContent: string): Promise<void>;
    saveFlashcardSet(setLabel: string, flashcards: string): Promise<void>;
    saveResumeProfile(profileName: string, profileData: string): Promise<void>;
    saveWorkflowState(state: string): Promise<void>;
    saveXP(userId: string, xp: bigint): Promise<void>;
    submitInterviewFeedback(feedbackId: string, feedbackContent: string): Promise<void>;
    submitUserNote(note: string): Promise<void>;
}
