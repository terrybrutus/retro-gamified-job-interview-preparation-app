import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";

actor Main {

  // ── Core data maps ──────────────────────────────────────────────────────────
  let userNotes = Map.empty<Text, Text>();
  let flashcardSets = Map.empty<Text, Text>();
  let interviewFeedback = Map.empty<Text, Text>();
  let resumeProfiles = Map.empty<Text, Text>();
  let coverLetters = Map.empty<Text, Text>();
  let coverLetterFeedbackSessions = Map.empty<Text, Text>();
  let acceptedSuggestions = Map.empty<Text, Text>();
  let exportNotes = Map.empty<Text, Text>();

  // ── Per-user maps (keyed by Principal) ──────────────────────────────────────
  let apiKeys = Map.empty<Principal, Text>();
  let workflowStates = Map.empty<Principal, Text>();
  let agentResults = Map.empty<Principal, Text>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ── File reference registry (app-level, path → hash) ────────────────────────
  type FileReference = { path : Text; hash : Text };
  let fileReferences = Map.empty<Text, FileReference>();

  // ── Access control ───────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();

  // ── XP / Career Level ────────────────────────────────────────────────────────
  let xpData = Map.empty<Text, Nat>();

  // ── Types ─────────────────────────────────────────────────────────────────────
  public type UserProfile = { name : Text };

  // ── Platform Mixins ──────────────────────────────────────────────────────────
  include MixinAuthorization(accessControlState);
  include MixinObjectStorage();

  // ═══════════════════════════════════════════════════════════════════════════
  // User Profile
  // ═══════════════════════════════════════════════════════════════════════════

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Notes
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func submitUserNote(note : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit notes");
    };
    userNotes.add(note, "");
  };

  public query ({ caller }) func getUserNotes() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view notes");
    };
    userNotes.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Flashcards
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveFlashcardSet(setLabel : Text, flashcards : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save flashcard sets");
    };
    flashcardSets.add(setLabel, flashcards);
  };

  public query ({ caller }) func getFlashcardSets() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view flashcard sets");
    };
    flashcardSets.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // File References (app-level tracking)
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can register file references");
    };
    fileReferences.add(path, { path; hash });
  };

  public query ({ caller }) func getFileReference(path : Text) : async FileReference {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get file references");
    };
    switch (fileReferences.get(path)) {
      case (?ref) ref;
      case null Runtime.trap("File reference not found");
    };
  };

  public query ({ caller }) func listFileReferences() : async [FileReference] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can list file references");
    };
    fileReferences.toArray().map(func((_k, v)) { v });
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can drop file references");
    };
    fileReferences.remove(path);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Interview Feedback
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func submitInterviewFeedback(feedbackId : Text, feedbackContent : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit interview feedback");
    };
    interviewFeedback.add(feedbackId, feedbackContent);
  };

  public query ({ caller }) func getInterviewFeedback() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view interview feedback");
    };
    interviewFeedback.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Resume Profiles
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveResumeProfile(profileName : Text, profileData : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save resume profiles");
    };
    resumeProfiles.add(profileName, profileData);
  };

  public query ({ caller }) func getResumeProfiles() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view resume profiles");
    };
    resumeProfiles.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Cover Letters
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveCoverLetter(letterId : Text, letterContent : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save cover letters");
    };
    coverLetters.add(letterId, letterContent);
  };

  public query ({ caller }) func getCoverLetters() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cover letters");
    };
    coverLetters.toArray();
  };

  public shared ({ caller }) func saveCoverLetterFeedbackSession(sessionId : Text, sessionData : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save cover letter feedback sessions");
    };
    coverLetterFeedbackSessions.add(sessionId, sessionData);
  };

  public query ({ caller }) func getCoverLetterFeedbackSessions() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cover letter feedback sessions");
    };
    coverLetterFeedbackSessions.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Accepted Suggestions
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveAcceptedSuggestion(jobId : Text, suggestion : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save accepted suggestions");
    };
    acceptedSuggestions.add(jobId, suggestion);
  };

  public query ({ caller }) func getAcceptedSuggestions() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view accepted suggestions");
    };
    acceptedSuggestions.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Export Notes
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveExportNote(noteId : Text, noteContent : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save export notes");
    };
    exportNotes.add(noteId, noteContent);
  };

  public query ({ caller }) func getExportNotes() : async [(Text, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view export notes");
    };
    exportNotes.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // API Keys & Workflow State
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveApiKey(apiKey : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save API keys");
    };
    apiKeys.add(caller, apiKey);
  };

  public query ({ caller }) func getApiKey() : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get API keys");
    };
    apiKeys.get(caller);
  };

  public shared ({ caller }) func saveWorkflowState(state : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save workflow state");
    };
    workflowStates.add(caller, state);
  };

  public query ({ caller }) func getWorkflowState() : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get workflow state");
    };
    workflowStates.get(caller);
  };

  public shared ({ caller }) func saveAgentResult(agentId : Text, result : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save agent results");
    };
    agentResults.add(caller, agentId # ":" # result);
  };

  public query ({ caller }) func getAgentResults() : async [(Principal, Text)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get agent results");
    };
    agentResults.toArray();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // XP & Career Level
  // ═══════════════════════════════════════════════════════════════════════════

  public shared ({ caller }) func saveXP(userId : Text, xp : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save XP");
    };
    xpData.add(userId, xp);
  };

  public query ({ caller }) func getXP(userId : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get XP");
    };
    switch (xpData.get(userId)) {
      case (?xp) xp;
      case null 0;
    };
  };

  public shared ({ caller }) func addXP(userId : Text, amount : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add XP");
    };
    let current = switch (xpData.get(userId)) {
      case (?xp) xp;
      case null 0;
    };
    let newXp = current + amount;
    xpData.add(userId, newXp);
    newXp;
  };

  public query ({ caller }) func getCareerLevel(userId : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get career level");
    };
    let xp = switch (xpData.get(userId)) {
      case (?xp) xp;
      case null 0;
    };
    let ratio : Float = xp.toFloat() / 100.0;
    Float.sqrt(ratio).toInt().toNat();
  };
};
