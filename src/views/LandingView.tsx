import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Sparkles, 
 ArrowRight, 
 ShieldCheck, 
 Layers, 
 CheckCircle2, 
 Cpu, 
 Zap, 
 Download, 
 Users, 
 BarChart3,
 GitBranch,
 Terminal,
 ChevronRight,
 Sun,
 Moon
} from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';
import { useThemeStore } from '../store/useThemeStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const LandingView: React.FC = () => {
 const navigate = useNavigate();
 const { isAuthenticated, user } = useSessionStore();
 const { theme, toggleTheme } = useThemeStore();

 const handleGetStarted = () => {
 if (isAuthenticated) {
 navigate('/new-session');
 } else {
 navigate('/login');
 }
 };

 return (
 <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
 {/* Top Global Navigation Bar using Design Tokens */}
 <nav className="fixed top-0 left-0 right-0 z-50 bg-card backdrop-blur-md border-b border-light-border px-6 py-4 shadow-xs">
 <div className="max-w-7xl mx-auto flex justify-between items-center">
 <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
 <div className="p-2 bg-primary-orange rounded-lg shadow-sm">
 <Cpu className="w-6 h-6 text-primary-foreground" />
 </div>
 <div>
 <span className="font-logo-title text-primary-orange">Unit-Test Case Generator Agent</span>
 <Badge variant="outline" className="text-[11px] bg-input text-primary-orange font-mono font-bold px-2 py-0.5 rounded border border-orange-border ml-2">
 v1.0 Enterprise
 </Badge>
 </div>
 </div>

 <div className="hidden md:flex items-center gap-8 text-sm font-dropdown-label">
 <a href="#features" className="hover:text-primary-orange transition-colors">Features</a>
 <a href="#architecture" className="hover:text-primary-orange transition-colors">7-Agent Graph</a>
 <a href="#workflow" className="hover:text-primary-orange transition-colors">Workflow</a>
 <a href="#security" className="hover:text-primary-orange transition-colors">Security & Guardrails</a>
 </div>

 <div className="flex items-center gap-4">
 <Button
 variant="ghost"
 size="icon"
 onClick={toggleTheme}
 className="rounded-full text-secondary-text"
 title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
 >
 {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
 </Button>
 {isAuthenticated ? (
 <div className="flex items-center gap-3">
 <span className="text-xs text-secondary-text font-mono hidden sm:inline-block">
 Logged in as <strong className="text-primary-orange">{user?.name}</strong>
 </span>
 <Button 
 onClick={() => navigate('/new-session')} 
 className="flex items-center gap-2 shadow-xs text-xs py-2 px-4"
 >
 Launch Workspace <ArrowRight className="w-4 h-4" />
 </Button>
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <Button 
 variant="ghost"
 onClick={() => navigate('/login')} 
 className="text-xs font-semibold text-secondary-text hover:text-foreground"
 >
 Sign In
 </Button>
 <Button 
 onClick={() => navigate('/login')} 
 className="flex items-center gap-2 shadow-xs text-xs py-2 px-4"
 >
 Get Started <ArrowRight className="w-4 h-4" />
 </Button>
 </div>
 )}
 </div>
 </div>
 </nav>

 {/* Hero Section */}
 <section className="pt-32 pb-16 px-6 relative overflow-hidden bg-background backdrop-blur-sm">
 <div className="max-w-5xl mx-auto text-center relative z-10">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-input border border-orange-border text-primary-orange text-xs font-bold uppercase tracking-wider mb-6">
 <Sparkles className="w-4 h-4 text-primary-orange" />
 Requirement-Driven AI Agentic Testing Architecture
 </div>

 <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-6">
 Shift Unit Test Case Generation Left With <br className="hidden sm:inline" />
 <span className="text-primary-orange">
 Autonomous AI Specialist Agents
 </span>
 </h1>

 <p className="font-instruction-text max-w-3xl mx-auto mb-10 leading-relaxed">
 Generate enterprise-ready, 100% requirement-aligned unit test suites directly from BRDs, OpenAPI specs, and SQL schemas. Validate business logic and boundary rules before writing code.
 </p>

 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
 <Button 
 size="lg"
 onClick={handleGetStarted}
 className="text-sm px-8 shadow-md flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
 >
 <Zap className="w-5 h-5" /> Start Test Case Generation Now <ArrowRight className="w-5 h-5" />
 </Button>
 <Button 
 variant="outline"
 size="lg"
 onClick={() => navigate('/login')}
 className="font-semibold text-sm px-6 shadow-xs flex items-center justify-center gap-2"
 >
 <Users className="w-4 h-4 text-primary-orange" /> Try Demo Login
 </Button>
 </div>

 {/* Quick Metrics Bar using Global Tokens */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-card backdrop-blur-sm border border-light-border rounded-xl shadow-xs">
 <div className="border-r border-light-border last:border-0">
 <div className="text-2xl sm:text-3xl font-extrabold text-primary-orange">100%</div>
 <div className="text-xs text-secondary-text mt-1 font-medium">Traceability Matrix Coverage</div>
 </div>
 <div className="border-r border-light-border last:border-0">
 <div className="text-2xl sm:text-3xl font-extrabold text-primary">7 Node</div>
 <div className="text-xs text-secondary-text mt-1 font-medium">LangGraph Stateful Graph</div>
 </div>
 <div className="border-r border-light-border last:border-0">
 <div className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-700 dark:text-green-400">0%</div>
 <div className="text-xs text-secondary-text mt-1 font-medium">AST Hallucination Rate</div>
 </div>
 <div>
 <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">10x</div>
 <div className="text-xs text-secondary-text mt-1 font-medium">Faster TDD Velocity</div>
 </div>
 </div>
 </div>
 </section>

 {/* Live Interactive Preview Section */}
 <section className="py-10 px-6 max-w-6xl mx-auto bg-background">
 <div className="bg-card backdrop-blur-sm border border-light-border rounded-xl p-4 sm:p-6 shadow-xl text-foreground">
 <div className="flex justify-between items-center border-b border-light-border pb-3 mb-4">
 <div className="flex items-center gap-2">
 <span className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-600 inline-block"></span>
 <span className="w-3 h-3 rounded-full bg-yellow-500 dark:bg-yellow-600 inline-block"></span>
 <span className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600 inline-block"></span>
 <span className="text-xs font-mono text-secondary-text ml-2 font-bold">unit-test-generator // LangGraph Interactive Execution Terminal</span>
 </div>
 <span className="text-[10px] font-mono text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/80 px-2.5 py-1 rounded border border-green-200 dark:border-green-800 font-bold">
 ● WORKFLOW ACTIVE
 </span>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 <div className="lg:col-span-5 space-y-2.5 text-xs font-mono">
 <div className="p-2.5 bg-muted rounded-md border border-light-border flex items-center justify-between text-secondary-text">
 <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 1. Orchestrator</span>
 <span className="text-green-700 dark:text-green-400 font-bold">COMPLETED</span>
 </div>
 <div className="p-2.5 bg-muted rounded-md border border-light-border flex items-center justify-between text-secondary-text">
 <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 2. Artifact Intake</span>
 <span className="text-green-700 dark:text-green-400 font-bold">BRD / OpenAPI Parsed</span>
 </div>
 <div className="p-2.5 bg-muted rounded-md border border-light-border flex items-center justify-between text-secondary-text">
 <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 3. Rule Decomposition</span>
 <span className="text-green-700 dark:text-green-400 font-bold">BR-001..BR-004 Extracted</span>
 </div>
 <div className="p-2.5 bg-muted rounded-md border border-light-border flex items-center justify-between text-secondary-text">
 <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 4. Service Contract</span>
 <span className="text-green-700 dark:text-green-400 font-bold">UserService / AuthService</span>
 </div>
 <div className="p-2.5 bg-muted border border-light-border rounded-md flex items-center justify-between text-primary font-bold">
 <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-primary animate-spin" /> 5. Unit Test Design</span>
 <span className="text-primary font-bold">GENERATING AAA CODE</span>
 </div>
 </div>

 <div className="lg:col-span-7 bg-background p-4 rounded-lg border border-light-border font-mono text-xs overflow-hidden">
 <div className="text-placeholder mb-2 border-b border-light-border pb-1 font-bold">
 // Generated Output Preview: UserServiceTest.java
 </div>
 <pre className="text-secondary-text leading-relaxed overflow-x-auto text-[11px]">
{`@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Requirement-Driven Test Suite")
public class UserServiceTest {

 @Mock private UserRepository userRepository;
 @Mock private PasswordEncoder passwordEncoder;
 @InjectMocks private UserService userService;

 @Test
 @DisplayName("UT-001: Register user with unique email and BCrypt hashing")
 void registerUser_Success() {
 // [ARRANGE] Mock repository to return empty (unique email)
 when(userRepository.findByEmail("john@example.com"))
 .thenReturn(Optional.empty());
 when(passwordEncoder.encode("P@ssword123!"))
 .thenReturn("$2a$10$encodedHash");

 // [ACT] Execute registration
 UserResponse res = userService.registerUser(request);

 // [ASSERT] Verify status and password encoding
 assertEquals(UserStatus.PENDING_VERIFICATION, res.getStatus());
 verify(userRepository, times(1)).save(any(User.class));
 }
}`}
 </pre>
 </div>
 </div>
 </div>
 </section>

 {/* Feature Highlights Grid */}
 <section id="features" className="py-16 px-6 max-w-7xl mx-auto">
 <div className="text-center mb-14">
 <h2 className="font-main-heading font-bold text-3xl text-foreground tracking-tight mb-3">
 Engineered for Enterprise Software Quality
 </h2>
 <p className="font-instruction-text max-w-2xl mx-auto text-sm">
 Shift left with an autonomous multi-agent architecture built on context engineering, AST syntax verification, and mandatory security guardrails.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-card backdrop-blur-md p-6 rounded-xl border border-light-border hover:border-orange-border transition-all shadow-xs group">
 <div className="p-3 bg-muted border border-light-border rounded-lg w-fit mb-5 text-primary-orange group-hover:scale-105 transition-transform">
 <Layers className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-foreground mb-2">7 Specialist AI Agents</h3>
 <p className="text-xs text-secondary-text leading-relaxed">
 Hierarchical LangGraph orchestration separating intake, business rule extraction, contract definition, test code design, and coverage review.
 </p>
 </div>

 <div className="bg-card backdrop-blur-md p-6 rounded-xl border border-light-border hover:border-orange-border transition-all shadow-xs group">
 <div className="p-3 bg-muted border border-light-border rounded-lg w-fit mb-5 text-primary-orange group-hover:scale-105 transition-transform">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-foreground mb-2">Mandatory Guardrails</h3>
 <p className="text-xs text-secondary-text leading-relaxed">
 Built-in secret redaction, prompt injection defense, and AST Python/Java syntax validation before persisting generated test suites.
 </p>
 </div>

 <div className="bg-card backdrop-blur-md p-6 rounded-xl border border-light-border hover:border-orange-border transition-all shadow-xs group">
 <div className="p-3 bg-muted border border-light-border rounded-lg w-fit mb-5 text-primary-orange group-hover:scale-105 transition-transform">
 <BarChart3 className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-foreground mb-2">Traceability Matrix</h3>
 <p className="text-xs text-secondary-text leading-relaxed">
 Automated 1:1 mapping from BRD rules (BR-001..BR-004) to specific `@Test` methods with clear coverage disposition tags.
 </p>
 </div>

 <div className="bg-card backdrop-blur-md p-6 rounded-xl border border-light-border hover:border-orange-border transition-all shadow-xs group">
 <div className="p-3 bg-muted border border-light-border rounded-lg w-fit mb-5 text-primary-orange group-hover:scale-105 transition-transform">
 <Download className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-foreground mb-2">Vendor Word Report & ZIP</h3>
 <p className="text-xs text-secondary-text leading-relaxed">
 Export executive summaries, architecture tables, and test suites in OpenXML Word (.docx) format or ready-to-run ZIP packages.
 </p>
 </div>

 <div className="bg-card backdrop-blur-md p-6 rounded-xl border border-light-border hover:border-orange-border transition-all shadow-xs group">
 <div className="p-3 bg-muted border border-light-border rounded-lg w-fit mb-5 text-primary-orange group-hover:scale-105 transition-transform">
 <GitBranch className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-foreground mb-2">Human-in-the-Loop Review</h3>
 <p className="text-xs text-secondary-text leading-relaxed">
 Interactive modal checkpoints allowing lead architects and QA managers to resolve ambiguous rules and re-trigger target tests.
 </p>
 </div>

 <div className="bg-card backdrop-blur-md p-6 rounded-xl border border-light-border hover:border-orange-border transition-all shadow-xs group">
 <div className="p-3 bg-muted border border-light-border rounded-lg w-fit mb-5 text-primary-orange group-hover:scale-105 transition-transform">
 <Terminal className="w-6 h-6" />
 </div>
 <h3 className="text-base font-bold text-foreground mb-2">Multi-Stack Support</h3>
 <p className="text-xs text-secondary-text leading-relaxed">
 Configurable technology profiles for Java 17 (JUnit 5 / Mockito 5), Python (pytest / unittest), and .NET (xUnit / Moq).
 </p>
 </div>
 </div>
 </section>

 {/* Call To Action Footer Banner using Global Design Tokens */}
 <section className="py-12 px-6 max-w-5xl mx-auto">
 <div className="bg-gradient-to-r from-orange-500/90 to-amber-500/90 backdrop-blur-sm rounded-2xl p-8 sm:p-10 text-center shadow-lg text-primary-foreground">
 <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
 Ready to Automate Your Unit Test Case Generation?
 </h2>
 <p className="text-orange-100 max-w-xl mx-auto text-xs sm:text-sm mb-6">
 Upload your BRD, OpenAPI YAML, or SQL schemas and watch 7 specialist agents produce AAA test suites in seconds.
 </p>
 <Button 
 variant="secondary"
 size="lg"
 onClick={handleGetStarted}
 className="font-bold text-xs px-8 shadow-sm inline-flex items-center gap-2 text-primary-orange bg-card hover:bg-muted"
 >
 Launch Agent Generator <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 </section>

 {/* Footer */}
 <footer className="border-t border-light-border bg-card py-6 px-6 text-center font-footer-text">
 Unit-Test Case Generator Agent • High-Level Techno-Functional Architecture V1.0 • August 2026
 </footer>
 </div>
 );
};
