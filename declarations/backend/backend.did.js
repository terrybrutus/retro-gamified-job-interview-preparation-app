export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  return IDL.Service({
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getAcceptedSuggestions' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getAgentResults' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))],
        ['query'],
      ),
    'getApiKey' : IDL.Func([], [IDL.Opt(IDL.Text)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getCoverLetterFeedbackSessions' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getCoverLetters' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getExportNotes' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getFlashcardSets' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getInterviewFeedback' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getResumeProfiles' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getUserNotes' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'getWorkflowState' : IDL.Func([], [IDL.Opt(IDL.Text)], ['query']),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveAcceptedSuggestion' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveAgentResult' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveApiKey' : IDL.Func([IDL.Text], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'saveCoverLetter' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveCoverLetterFeedbackSession' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveExportNote' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveFlashcardSet' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveResumeProfile' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveWorkflowState' : IDL.Func([IDL.Text], [], []),
    'submitInterviewFeedback' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'submitUserNote' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
