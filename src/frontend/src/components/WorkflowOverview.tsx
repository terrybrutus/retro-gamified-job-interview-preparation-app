import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  Rocket,
  Search,
  Sparkles,
  StickyNote,
  Target,
  TrendingUp,
  User,
} from "lucide-react";

interface WorkflowOverviewProps {
  onNavigateToJobPrep: () => void;
  completionStats: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export function WorkflowOverview({
  onNavigateToJobPrep,
  completionStats,
}: WorkflowOverviewProps) {
  const workflowSteps = [
    {
      icon: Search,
      title: "Job Search",
      description: "Find opportunities",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: FileText,
      title: "Job Description",
      description: "Upload requirements",
      color: "from-green-500 to-green-600",
    },
    {
      icon: User,
      title: "Resume",
      description: "Manage versions",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: TrendingUp,
      title: "Match Analysis",
      description: "Check compatibility",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Mail,
      title: "Cover Letter",
      description: "Generate & refine",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: GraduationCap,
      title: "Flashcards",
      description: "Study questions",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      icon: MessageSquare,
      title: "Interview Advice",
      description: "Honest feedback",
      color: "from-red-500 to-red-600",
    },
    {
      icon: StickyNote,
      title: "Notes",
      description: "Track progress",
      color: "from-teal-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      {/* Condensed Hero Section */}
      <Card className="card-modern gradient-primary text-primary-foreground border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <CardHeader className="text-center pb-3 relative z-10">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl font-bold mb-2 text-white drop-shadow-lg">
            Interview Preparation Workflow
          </CardTitle>
          <CardDescription className="text-sm max-w-lg mx-auto text-white/90 drop-shadow-sm">
            Complete AI-powered interview preparation from job search to final
            notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 relative z-10 pb-4">
          {/* Compact Progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1 text-white">
                <Sparkles className="w-3 h-3" />
                Progress
              </span>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 text-xs"
              >
                {completionStats.completed}/{completionStats.total}
              </Badge>
            </div>
            <Progress
              value={completionStats.percentage}
              className="h-2 bg-white/20"
            />
            <p className="text-xs text-white/80 mt-1">
              {completionStats.percentage}% complete
            </p>
          </div>

          {/* Quick Start Button */}
          <div className="text-center">
            <Button
              onClick={onNavigateToJobPrep}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-modern-lg btn-modern touch-target"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Start Preparation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Condensed Workflow Steps */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">
            8-Step Workflow
          </CardTitle>
          <CardDescription className="text-sm">
            Complete preparation process for interview success
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="group">
                  <div className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} text-white shadow-modern-sm group-hover:scale-105 transition-transform duration-300 mb-2`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-medium text-foreground mb-1">
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Essential Features */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium">Real Job Search</span>
                <p className="text-xs text-muted-foreground">
                  Live job listings with company details
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium">AI Analysis</span>
                <p className="text-xs text-muted-foreground">
                  Match assessment and feedback
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium">Honest Feedback</span>
                <p className="text-xs text-muted-foreground">
                  Direct criticism, no sugarcoating
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium">Study Materials</span>
                <p className="text-xs text-muted-foreground">
                  Flashcards and personalized advice
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="card-modern gradient-secondary border-primary/20">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Get Started
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg w-fit mx-auto mb-2">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-medium text-sm mb-1">Find Jobs</h4>
              <p className="text-xs text-muted-foreground">
                Search or upload descriptions
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/50">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg w-fit mx-auto mb-2">
                <User className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-medium text-sm mb-1">Add Resume</h4>
              <p className="text-xs text-muted-foreground">
                Upload for AI analysis
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/50">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg w-fit mx-auto mb-2">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-medium text-sm mb-1">Prepare</h4>
              <p className="text-xs text-muted-foreground">
                Get materials and feedback
              </p>
            </div>
          </div>

          <Button
            onClick={onNavigateToJobPrep}
            size="lg"
            className="btn-modern touch-target shadow-modern-lg"
          >
            <Target className="w-4 h-4 mr-2" />
            Begin Preparation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
