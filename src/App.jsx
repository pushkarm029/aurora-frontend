// 📦 External Libraries
import { Suspense, lazy, ErrorBoundary } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContextProvider } from "@/context/ToastContext";
import "../src/lib/polyfills";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import PerformanceReporter from "@/components/common/performance-reporter";

// 🏗️ Layout (Keep non-lazy for immediate render)
import MainLayout from "@/components/layout/main-layout";

// 🔄 Loading Components
const AppLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div className="text-gray-400 text-sm">Loading Aurora...</div>
    </div>
  </div>
);

const RouteLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh] bg-[#0d1117]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
      <div className="text-gray-400 text-xs">Loading page...</div>
    </div>
  </div>
);

const ComponentLoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
  </div>
);

// 🚨 Error Boundary Component
const RouteErrorBoundary = ({ children, fallback }) => (
  <ErrorBoundary
    fallback={
      fallback || (
        <div className="flex items-center justify-center min-h-[60vh] bg-[#0d1117]">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-2">⚠️ Something went wrong</div>
            <div className="text-gray-400 text-sm">Failed to load this page</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
  >
    {children}
  </ErrorBoundary>
);

// 🔄 Enhanced Lazy Loading with Error Boundaries
const createLazyComponent = (importFn, fallback = <RouteLoadingSpinner />) => {
  const LazyComponent = lazy(importFn);

  return (props) => (
    <RouteErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </RouteErrorBoundary>
  );
};

// 🎯 CRITICAL ROUTES (High Priority - Load First)
const LoginPage = createLazyComponent(() => import("@/pages/auth/login"));
const RegisterPage = createLazyComponent(() => import("@/pages/auth/register"));
const VerifyEmailPage = createLazyComponent(() => import("@/pages/auth/verify-email"));
const HomePage = createLazyComponent(() => import("@/pages/aurora-site/home"));

// 📚 CORE LEARNING ROUTES (High Priority)
const CourseListing = createLazyComponent(() => import("./pages/aurora-site/course-listing/course-listing-page"));
const CourseNavigation = createLazyComponent(() => import("./pages/aurora-site/course-navigation"));
const ListeningPage = createLazyComponent(() => import("@/pages/aurora-site/learning/listening-content"));
const ReadingContent = createLazyComponent(() => import("@/pages/aurora-site/learning/reading-content"));
const SpeakingPage = createLazyComponent(() => import("@/pages/aurora-site/learning/speaking-content"));
const VocabularyPage = createLazyComponent(() => import("@/pages/aurora-site/learning/vocabulary-content"));

// 🎓 COURSE & CERTIFICATION ROUTES (Medium Priority)
const BasicListeningCoursePage = createLazyComponent(() => import("@/components/listening-courses/basic-listening/BasicListeningCoursePage"));
const CulturalAssessmentPage = createLazyComponent(() => import("@/pages/aurora-site/learning/cultural-assessment"));
const ConversationAssessmentPage = createLazyComponent(() => import("@/pages/aurora-site/learning/conversation-assessment"));
const BusinessEnglish = createLazyComponent(() => import("@/pages/learning/business-english"));
const CertificationContent = createLazyComponent(() => import("@/pages/aurora-site/english-level/english-level-content"));
const CertificationsObtained = createLazyComponent(() => import("@/pages/aurora-site/english-level/english-level-obtained"));
const ModuleDetails = createLazyComponent(() => import("@/pages/aurora-site/modules/module-details"));

// 🏛️ GRAMMAR & LANGUAGE ROUTES (Medium Priority)
const GrammarContent = createLazyComponent(() => import("@/pages/aurora-site/grammar-content"));
const PresentSimpleCoursePage = createLazyComponent(() => import("@/pages/aurora-site/present-simple-course"));
const SocialMediaCoursePage = createLazyComponent(() => import("@/pages/aurora-site/social-media-course"));
const PastSimpleCoursePage = createLazyComponent(() => import("@/pages/aurora-site/past-simple-course"));
const GreetingIntro = createLazyComponent(() => import("./pages/GreatingandInto/greetingandIntroduction"));
const GrammarCourse = createLazyComponent(() => import("./pages/grammercourse/grammercourse"));

// 📝 PRACTICE & EXERCISE ROUTES (Medium Priority)
const PracticeSystem = createLazyComponent(() => import("@/components/practices/funny_practices/DragDropSentenceBuilder"));
const IdiomChallenge = createLazyComponent(() => import("@/components/practices/funny_practices/idiom-challenge"));
const SentenceBuilder = createLazyComponent(() => import("@/components/practices/funny_practices/SentenceBuilder"));
const DirectionsCourse = createLazyComponent(() => import("@/components/practices/directions-course/directions-course"));
const FillInTheBlanksQuizPage = createLazyComponent(() => import("@/components/practices/funny_practices/FillInTheBlanksPage"));
const Quiz = createLazyComponent(() => import("@/components/practices/funny_practices/QuizPage"));
const QuestionCreator = createLazyComponent(() => import("@/components/practices/question-creator/question-creator"));

// 🎮 GAME ROUTES (Lower Priority - Heavy Components)
const StoryGame = createLazyComponent(() => import("@/pages/games/story-game"), <ComponentLoadingSpinner />);
const WordMatching = createLazyComponent(() => import("@/pages/games/word-matching"), <ComponentLoadingSpinner />);
const GamePanel = createLazyComponent(() => import("@/pages/games/game-panel"), <ComponentLoadingSpinner />);
const GameBoard = createLazyComponent(() => import("./components/games/memory-card/game-board"), <ComponentLoadingSpinner />);
const DifficultySelector = createLazyComponent(() => import("./components/games/word-matching/difficulty-selector"), <ComponentLoadingSpinner />);

// 🌐 COMMUNITY & INTERACTION ROUTES (Medium Priority)
const AuroraChat = createLazyComponent(() => import("@/pages/aurora-site/aurora-chat"));
const CommunityInteractionPage = createLazyComponent(() => import("@/pages/aurora-site/community/community"));
const TeacherDirectoryPage = createLazyComponent(() => import("@/pages/aurora-site/teacher-directory/teacher-directory"));
const LeaderboardPage = createLazyComponent(() => import("@/pages/aurora-site/community/leaderboard"));
const PublicProfile = createLazyComponent(() => import("@/pages/public-profile/public-profile"));

// ⚙️ SYSTEM & SETTINGS ROUTES (Lower Priority)
const Notifications = createLazyComponent(() => import("@/pages/aurora-site/notifications"));
const SettingsPage = createLazyComponent(() => import("@/pages/aurora-site/settings"));
const WalletConnection = createLazyComponent(() => import("@/pages/aurora-site/wallet/wallet-connection"));
const FAQPage = createLazyComponent(() => import("./components/faq/faq"));
const GitHubProfiles = createLazyComponent(() => import("./components/github-profiles/profilesComponent"));
const Analytics = createLazyComponent(() => import("@/pages/aurora-site/analytics"));
const Categories = createLazyComponent(() => import("@/pages/aurora-site/categories"));

// 🎧 AUDIO ASSESSMENT ROUTES (Medium Priority)
const PronunciationAssessmentPage = createLazyComponent(() => import("@/pages/aurora-site/assessment/pronunciation-assessment"));
const ListeningComprehensionPage = createLazyComponent(() => import("@/pages/aurora-site/assessment/listening-comprehension"));

// 👨‍🏫 TEACHER & ADMIN ROUTES (Lower Priority)
const EscrowClassesPage = createLazyComponent(() => import("@/pages/aurora-site/escrow/classes"));
const TeacherSignupPage = createLazyComponent(() => import("@/pages/teacher-signup"));
const PlacementTest = createLazyComponent(() => import("./pages/placementTest"));
const MyRequestsPage = createLazyComponent(() => import("@/pages/aurora-site/my-requests"));
const CertificatePage = createLazyComponent(() => import("@/pages/aurora-site/certificate"));

// 💰 REWARDS & GAMIFICATION (Lower Priority)
const RewardsSystem = createLazyComponent(() => import("@/pages/aurora-site/rewards/page.jsx"));

// 🔗 BLOCKCHAIN & HEAVY FEATURES (Lowest Priority - Defer Loading)
const MockPage = createLazyComponent(() =>
  import("@/components/stellar/mock_page").then(module => ({ default: module.default }))
    .catch(() => import("@/components/common/feature-unavailable")),
  <ComponentLoadingSpinner />
);

const NFTInteract = createLazyComponent(() =>
  import("@/components/stellar/nft-interact").then(module => ({ default: module.default }))
    .catch(() => import("@/components/common/feature-unavailable")),
  <ComponentLoadingSpinner />
);

// 🎯 MAIN APP COMPONENT
function App() {
  return (
    <Router>
      <ToastContextProvider>
        <AuthProvider>
          <PerformanceReporter />

          <RouteErrorBoundary
            fallback={
              <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
                <div className="text-center">
                  <div className="text-red-400 text-xl mb-4">⚠️ Application Error</div>
                  <div className="text-gray-400 mb-4">Something went wrong with the application</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reload Application
                  </button>
                </div>
              </div>
            }
          >
            <Suspense fallback={<AppLoadingSpinner />}>
              <Routes>
                {/* 🔐 AUTH ROUTES - No MainLayout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* 🌐 PUBLIC PROFILE - No MainLayout */}
                <Route path="/u/:username" element={<PublicProfile />} />

                {/* 🏠 PUBLIC ROUTES */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/course-listing" element={<CourseListing />} />
                  <Route path="/course-navigation" element={<CourseNavigation />} />
                  <Route path="/my-requests" element={<MyRequestsPage />} />
                  <Route path="/escrow/classes" element={<EscrowClassesPage />} />
                </Route>

                {/* 🔒 PROTECTED ROUTES WITH MAINLAYOUT */}
                <Route element={<MainLayout />}>
                  {/* Core Learning Features */}
                  <Route path="/listening" element={<ListeningPage />} />
                  <Route path="/listening-course" element={<BasicListeningCoursePage />} />
                  <Route path="/listening-course/:lessonId" element={<BasicListeningCoursePage />} />
                  <Route path="/reading" element={<ReadingContent />} />
                  <Route path="/speaking" element={<SpeakingPage />} />
                  <Route path="/vocabulary" element={<VocabularyPage />} />

                  {/* Grammar & Language */}
                  <Route path="/grammar" element={<GrammarContent />} />
                  <Route path="/present-simple-course" element={<PresentSimpleCoursePage />} />
                  <Route path="/social-media-course" element={<SocialMediaCoursePage />} />
                  <Route path="/past-simple-course" element={<PastSimpleCoursePage />} />
                  <Route path="/greetingcourse" element={<GreetingIntro />} />
                  <Route path="/grammercourse" element={<GrammarCourse />} />

                  {/* Assessments */}
                  <Route path="/cultural-assessment" element={<CulturalAssessmentPage />} />
                  <Route path="/conversation-assessment" element={<ConversationAssessmentPage />} />
                  <Route path="/assessment/pronunciation" element={<PronunciationAssessmentPage />} />
                  <Route path="/assessment/listening" element={<ListeningComprehensionPage />} />
                  <Route path="/placement-test" element={<PlacementTest />} />

                  {/* Courses & Certifications */}
                  <Route path="/certification-content" element={<CertificationContent />} />
                  <Route path="/certifications-obtained" element={<CertificationsObtained />} />
                  <Route path="/module-details" element={<ModuleDetails />} />
                  <Route path="/business-english" element={<BusinessEnglish />} />
                  <Route path="/certificate" element={<CertificatePage />} />

                  {/* Practice & Exercises */}
                  <Route path="/practiceSystem" element={<PracticeSystem />} />
                  <Route path="/practice/sentence-builder" element={<SentenceBuilder />} />
                  <Route path="/practice/idiom-challenge" element={<IdiomChallenge />} />
                  <Route path="/practice/drag-drop-sentence-builder" element={<PracticeSystem />} />
                  <Route path="/practice/quiz" element={<Quiz />} />
                  <Route path="/practice/fill-in-the-blanks" element={<FillInTheBlanksQuizPage />} />
                  <Route path="/practice/directions-course" element={<DirectionsCourse />} />
                  <Route path="/question-creator" element={<QuestionCreator />} />

                  {/* Games */}
                  <Route path="/games" element={<GamePanel />} />
                  <Route path="/games/story-game" element={<StoryGame />} />
                  <Route path="/games/word-matching" element={<WordMatching />} />
                  <Route path="/games/memory-card" element={<DifficultySelector />} />
                  <Route path="/games/memory-card/:levelId" element={<GameBoard />} />

                  {/* Community */}
                  <Route path="/community" element={<CommunityInteractionPage />} />
                  <Route path="/teacher-directory" element={<TeacherDirectoryPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/aurora-chat" element={<AuroraChat />} />

                  {/* System & Settings */}
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/analytics" element={<Analytics />} />

                  {/* Teacher Features */}
                  <Route path="/teacher-signup" element={<TeacherSignupPage />} />

                  {/* Wallet & Blockchain */}
                  <Route path="/wallet-connection" element={<WalletConnection />} />
                  <Route path="/mock" element={<MockPage />} />
                  <Route path="/nft-interact" element={<NFTInteract />} />

                  {/* Rewards */}
                  <Route path="/reward-system" element={<RewardsSystem />} />

                  {/* Support */}
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/team" element={<GitHubProfiles />} />
                </Route>

                {/* 🚫 FALLBACK ROUTE */}
                <Route
                  path="*"
                  element={
                    <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <div className="text-xl text-gray-400 mb-2">Page Not Found</div>
                        <div className="text-gray-500 mb-6">The page you're looking for doesn't exist.</div>
                        <a
                          href="/"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                        >
                          Go Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </ToastContextProvider>
    </Router>
  );
}

export default App;