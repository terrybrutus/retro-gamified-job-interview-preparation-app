import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle,
  FileDown,
  Layers,
  Shuffle,
  Star,
  Target,
  User,
} from "lucide-react";
import { useState } from "react";

interface FeedbackSuggestion {
  id: string;
  category: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  status: "accepted";
  timestamp: number;
  editedContent?: string;
}

interface StoredResume {
  id: string;
  filename: string;
  uploadDate: string;
  content: string;
  extractedContent: string;
  fileType: string;
}

interface ResumeTailoringInterfaceProps {
  storedResumes: StoredResume[];
  acceptedSuggestions: FeedbackSuggestion[];
  jobDescription: string;
  onGenerateResume: () => void;
  isGenerating: boolean;
}

export function ResumeTailoringInterface({
  storedResumes,
  acceptedSuggestions,
  jobDescription: _jobDescription,
  onGenerateResume,
  isGenerating,
}: ResumeTailoringInterfaceProps) {
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>(
    acceptedSuggestions.map((s) => s.id),
  );

  const handleResumeToggle = (resumeId: string) => {
    setSelectedResumes((prev) =>
      prev.includes(resumeId)
        ? prev.filter((id) => id !== resumeId)
        : [...prev, resumeId],
    );
  };

  const handleSuggestionToggle = (suggestionId: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(suggestionId)
        ? prev.filter((id) => id !== suggestionId)
        : [...prev, suggestionId],
    );
  };

  const selectedSuggestionObjects = acceptedSuggestions.filter((s) =>
    selectedSuggestions.includes(s.id),
  );

  return (
    <div className="space-y-6">
      {/* Unified Application Package Overview */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Layers className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>Unified Application Package:</strong> Generate a resume that
          harmonizes with your cover letter, maintaining consistent 60-65%
          informal and 35-40% formal tone while ensuring complementary messaging
          across both documents.
        </AlertDescription>
      </Alert>

      {/* Resume Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Select Base Resume (Optional)
          </CardTitle>
          <CardDescription>
            Choose a stored resume as the foundation, or generate a harmonized
            resume based on your current resume content and applied feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storedResumes.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No stored resumes available. The system will use your current
                resume content for harmonization. Upload resumes in the Resume
                Management section for more options.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {storedResumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                    selectedResumes.includes(resume.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <Checkbox
                    id={`resume-${resume.id}`}
                    checked={selectedResumes.includes(resume.id)}
                    onCheckedChange={() => handleResumeToggle(resume.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`resume-${resume.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {resume.filename}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Uploaded:{" "}
                      {new Date(resume.uploadDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {resume.extractedContent.substring(0, 150)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applied Feedback Harmonization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-primary" />
            Applied Feedback for Harmonization
          </CardTitle>
          <CardDescription>
            These applied cover letter suggestions will be harmonized with your
            resume to ensure consistent messaging and tone across your
            application package.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acceptedSuggestions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No applied suggestions available. Generate and analyze a cover
                letter first, then apply feedback suggestions to get harmonized
                resume improvements.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                {acceptedSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                      selectedSuggestions.includes(suggestion.id)
                        ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                        : "border-border"
                    }`}
                  >
                    <Checkbox
                      id={`suggestion-${suggestion.id}`}
                      checked={selectedSuggestions.includes(suggestion.id)}
                      onCheckedChange={() =>
                        handleSuggestionToggle(suggestion.id)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            suggestion.priority === "high"
                              ? "destructive"
                              : suggestion.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {suggestion.priority.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">
                          {suggestion.category}
                        </span>
                        <Badge
                          variant="default"
                          className="text-xs bg-green-600"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Applied
                        </Badge>
                      </div>
                      <label
                        htmlFor={`suggestion-${suggestion.id}`}
                        className="text-sm text-foreground cursor-pointer block mb-1"
                      >
                        {suggestion.issue}
                      </label>
                      {suggestion.editedContent && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-400 mt-2">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            Applied Solution:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {suggestion.editedContent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Harmonization Summary and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Unified Application Package Generation
          </CardTitle>
          <CardDescription>
            Generate an ATS-friendly resume that harmonizes with your cover
            letter for consistent tone and complementary messaging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">
                Base Resume Selection
              </h4>
              {selectedResumes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Using current resume content for harmonization
                </p>
              ) : (
                <div className="space-y-1">
                  {selectedResumes.map((resumeId) => {
                    const resume = storedResumes.find((r) => r.id === resumeId);
                    return resume ? (
                      <div key={resumeId} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{resume.filename}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">
                Harmonization Feedback
              </h4>
              {selectedSuggestionObjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No feedback selected for harmonization
                </p>
              ) : (
                <div className="space-y-1">
                  {selectedSuggestionObjects.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center gap-2"
                    >
                      <Shuffle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{suggestion.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <Layers className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Harmonized ATS Resume Generation:</strong> The system
                will create a beautifully formatted HTML resume that maintains
                consistent 60-65% informal and 35-40% formal tone with your
                cover letter, then automatically convert it to PDF using YakPDF
                for download.
              </AlertDescription>
            </Alert>

            <Button
              onClick={onGenerateResume}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Layers className="w-5 h-5 mr-2 animate-spin" />
                  Generating Harmonized Resume & Converting to PDF...
                </>
              ) : (
                <>
                  <Layers className="w-5 h-5 mr-2" />
                  Generate Unified Application Package
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground text-center">
              <p className="font-medium">Unified Package Benefits:</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>
                  • Consistent 60-65% informal, 35-40% formal tone across
                  documents
                </li>
                <li>
                  • Complementary messaging between cover letter and resume
                </li>
                <li>• Applied feedback harmonized across both documents</li>
                <li>• ATS-optimized while maintaining human readability</li>
                <li>
                  • Professional presentation as a cohesive application package
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
