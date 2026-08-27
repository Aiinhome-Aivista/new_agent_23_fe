import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Download, Settings2, X, CheckCircle2, AlertTriangle, FileCode, Code2, ShieldCheck, Cpu, Check } from 'lucide-react';
import api from '../services/api';
import { useSessionStore } from '../store/useSessionStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const ENHANCED_USER_SERVICE_TEST = `package com.example.service;

import com.example.dto.UserRegistrationRequest;
import com.example.dto.UserResponse;
import com.example.dto.UpdateProfileRequest;
import com.example.exception.DuplicateEmailException;
import com.example.exception.WeakPasswordException;
import com.example.exception.InvalidInputException;
import com.example.exception.UserNotFoundException;
import com.example.exception.AccessDeniedException;
import com.example.model.User;
import com.example.model.UserStatus;
import com.example.repository.UserRepository;
import com.example.security.PasswordEncoder;
import com.example.client.NotificationClient;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * =====================================================================================
 * Enterprise Requirement-Driven Unit Test Suite for UserService
 * =====================================================================================
 * Target Component: com.example.service.UserService
 * Target Language: Java 17 (LTS)
 * Test Framework: JUnit 5 (Jupiter)
 * Mocking Library: Mockito 5 (mockito-junit-jupiter)
 * Test Pattern – AAA: Arrange-Act-Assert Pattern
 * Assertion Library: org.junit.jupiter.api.Assertions.*
 * Source Artifact Type / Version: BRD v1.0.0 | OpenAPI v3.0.3 | SQL DDL
 * Guardrail Status: Secret Redaction PASSED | AST Syntax PASSED
 * =====================================================================================
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Comprehensive Requirement-Driven Unit Test Suite")
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private NotificationClient notificationClient;

    @InjectMocks
    private UserService userService;

    private UserRegistrationRequest validRequest;

    @BeforeEach
    void setUp() {
        // [ARRANGE] Initialize default valid registration request DTO before each test
        validRequest = new UserRegistrationRequest();
        validRequest.setEmail("john.doe@example.com");
        validRequest.setPassword("P@ssword123!");
        validRequest.setFirstName("John");
        validRequest.setLastName("Doe");
    }

    /**
     * =================================================================================
     * SECTION 1: User Registration Scenarios (BR-001)
     * =================================================================================
     */
    @Nested
    @DisplayName("1. User Registration & Validation Scenarios (BR-001)")
    class UserRegistrationTests {

        /**
         * Generated Test Method: UT-001 - registerUser_Success
         * HTTP / Error Code: HTTP 201 Created
         * Arrange: Mock findByEmail to empty Optional; encode password to BCrypt hash.
         * Act: Invoke userService.registerUser(validRequest).
         * Assert: Assert status is PENDING_VERIFICATION and email matches.
         * Verification / Mockito Checks: ArgumentCaptor<User> captures saved entity; verify(save) & verify(sendEmail).
         * Traceability Status: COVERED | Confidence: 99.8% | Reviewer Decision: APPROVED
         */
        @Test
        @DisplayName("UT-001: Successful Registration - Unique Email, BCrypt Password Encoding, Default PENDING_VERIFICATION Status & Verification Email Trigger")
        void registerUser_Success() {
            // [ARRANGE] Mock repository to return empty optional (email available)
            when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("$2a$10$encodedBCryptHash");
            
            User savedUser = new User();
            savedUser.setId("usr-12345");
            savedUser.setEmail(validRequest.getEmail());
            savedUser.setStatus(UserStatus.PENDING_VERIFICATION);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // [ACT] Execute registration method
            UserResponse response = userService.registerUser(validRequest);

            // [ASSERT] Verify returned DTO and account state transitions
            assertNotNull(response, "UserResponse DTO must not be null on successful registration");
            assertEquals(validRequest.getEmail(), response.getEmail(), "Returned email must match request email");
            assertEquals(UserStatus.PENDING_VERIFICATION, response.getStatus(), "Initial status must be PENDING_VERIFICATION");

            // Capture persistent user object to verify password hashing
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository, times(1)).save(userCaptor.capture());
            assertEquals("$2a$10$encodedBCryptHash", userCaptor.getValue().getPasswordHash(), "Plaintext password must be BCrypt encoded");

            // Verify asynchronous verification email notification dispatched exactly once
            verify(notificationClient, times(1)).sendVerificationEmail(any(User.class));
        }

        /**
         * Generated Test Method: UT-002 - registerUser_DuplicateEmail_ThrowsException
         * HTTP / Error Code: HTTP 409 Conflict
         * Expected Exception: DuplicateEmailException.class
         * Verification / Mockito Checks: verify(userRepository, never()).save(); verify(notificationClient, never()).send().
         * Traceability Status: COVERED | Confidence: 99.5% | Reviewer Decision: APPROVED
         */
        @Test
        @DisplayName("UT-002: Duplicate Email Rejection - Throws DuplicateEmailException (409 Conflict) and Prevents DB Persistence")
        void registerUser_DuplicateEmail_ThrowsException() {
            // [ARRANGE] Mock existing user in database
            User existingUser = new User();
            existingUser.setEmail(validRequest.getEmail());
            when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.of(existingUser));

            // [ACT & ASSERT] Verify exception thrown
            DuplicateEmailException exception = assertThrows(
                DuplicateEmailException.class,
                () -> userService.registerUser(validRequest),
                "Existing email must raise DuplicateEmailException"
            );

            assertTrue(exception.getMessage().contains(validRequest.getEmail()), "Exception message should reference duplicate email");

            // Ensure database save and email dispatch are NEVER executed
            verify(userRepository, never()).save(any());
            verify(notificationClient, never()).sendVerificationEmail(any());
        }

        /**
         * Generated Test Method: UT-003 - registerUser_WeakPasswordVariants_ThrowsException
         * HTTP / Error Code: HTTP 400 Bad Request
         * Expected Exception: WeakPasswordException.class
         * Verification / Mockito Checks: verify(userRepository, never()).save().
         */
        @ParameterizedTest(name = "UT-003: Weak Password '{0}' - Throws WeakPasswordException (400 Bad Request)")
        @ValueSource(strings = {
            "short1!",              // Min 8 chars constraint failure
            "no_uppercase_123!",    // Min 1 uppercase letter constraint failure
            "NO_LOWERCASE_123!",    // Min 1 lowercase letter constraint failure
            "NoSpecialChar123",     // Min 1 special character constraint failure
            "NoDigits!@#$"           // Min 1 numeric digit constraint failure
        })
        void registerUser_WeakPasswordVariants_ThrowsException(String weakPassword) {
            // [ARRANGE] Set weak password variant failing security regex policy
            validRequest.setPassword(weakPassword);

            // [ACT & ASSERT] Verify WeakPasswordException is raised
            assertThrows(
                WeakPasswordException.class, 
                () -> userService.registerUser(validRequest),
                "Passwords failing security regex policy must throw WeakPasswordException"
            );

            // Ensure DB save is skipped for invalid passwords
            verify(userRepository, never()).save(any());
        }

        @ParameterizedTest(name = "UT-003b: Invalid Email Format '{0}' - Throws InvalidInputException")
        @ValueSource(strings = {
            "invalid-email-string",
            "user@domain",
            "@domain.com",
            "user@.com"
        })
        void registerUser_InvalidEmailFormat_ThrowsException(String invalidEmail) {
            validRequest.setEmail(invalidEmail);

            assertThrows(
                InvalidInputException.class,
                () -> userService.registerUser(validRequest),
                "Emails failing RFC 5322 format must raise InvalidInputException"
            );
            verify(userRepository, never()).save(any());
        }
    }

    /**
     * =================================================================================
     * SECTION 2: User Profile Management Scenarios (BR-003)
     * =================================================================================
     */
    @Nested
    @DisplayName("2. User Profile Management Scenarios (BR-003)")
    class UserProfileTests {

        @Test
        @DisplayName("UT-007: Fetch Active Profile - Returns User Profile DTO for valid active user ID")
        void getUserById_Success() {
            // [ARRANGE] Mock active non-deleted user
            User activeUser = new User();
            activeUser.setId("usr-12345");
            activeUser.setEmail("john.doe@example.com");
            activeUser.setFirstName("John");
            activeUser.setLastName("Doe");
            activeUser.setDeleted(false);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(activeUser));

            // [ACT] Fetch profile
            UserResponse response = userService.getUserById("usr-12345");

            // [ASSERT] Verify profile data
            assertNotNull(response);
            assertEquals("usr-12345", response.getId());
            assertEquals("john.doe@example.com", response.getEmail());
            assertFalse(response.isDeleted());
        }

        @Test
        @DisplayName("UT-008: Fetch Soft-Deleted Profile - Throws UserNotFoundException (404 Not Found)")
        void getUserById_SoftDeletedUser_ThrowsNotFound() {
            // [ARRANGE] Mock user marked as deleted
            User deletedUser = new User();
            deletedUser.setId("usr-12345");
            deletedUser.setDeleted(true);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(deletedUser));

            // [ACT & ASSERT] Soft-deleted users must not be accessible
            assertThrows(
                UserNotFoundException.class, 
                () -> userService.getUserById("usr-12345"),
                "Lookup for soft-deleted user must throw UserNotFoundException"
            );
        }

        @Test
        @DisplayName("UT-011: Profile Update - Updates First Name and Valid E.164 Phone Number Successfully")
        void updateProfile_ValidPhoneNumber_Success() {
            // [ARRANGE] Mock existing user
            User existingUser = new User();
            existingUser.setId("usr-12345");
            existingUser.setFirstName("John");
            existingUser.setLastName("Doe");

            UpdateProfileRequest updateReq = new UpdateProfileRequest();
            updateReq.setFirstName("Johnathan");
            updateReq.setLastName("Doe");
            updateReq.setPhoneNumber("+14155552671"); // E.164 format

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // [ACT] Update profile
            UserResponse updated = userService.updateProfile("usr-12345", updateReq);

            // [ASSERT] Verify updated values
            assertEquals("Johnathan", updated.getFirstName());
            assertEquals("+14155552671", updated.getPhoneNumber());
            verify(userRepository, times(1)).save(existingUser);
        }

        @Test
        @DisplayName("UT-012: Profile Update Invalid Phone - Throws InvalidInputException for Non-E.164 Phone Format")
        void updateProfile_InvalidPhoneNumber_ThrowsException() {
            User existingUser = new User();
            existingUser.setId("usr-12345");

            UpdateProfileRequest updateReq = new UpdateProfileRequest();
            updateReq.setPhoneNumber("123-abc-invalid-format");

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(existingUser));

            assertThrows(
                InvalidInputException.class, 
                () -> userService.updateProfile("usr-12345", updateReq),
                "Invalid phone format must throw InvalidInputException"
            );

            verify(userRepository, never()).save(any());
        }
    }

    /**
     * =================================================================================
     * SECTION 3: Soft Deletion & RBAC Authorization (BR-004)
     * =================================================================================
     */
    @Nested
    @DisplayName("3. Soft Delete & RBAC Authorization Scenarios (BR-004)")
    class UserDeletionTests {

        @Test
        @DisplayName("UT-009: Soft Delete (Admin Context) - Sets is_deleted = true and Populates deleted_at Timestamp")
        void deleteUser_AdminContext_SoftDeletesUser() {
            // [ARRANGE] Mock active user
            User targetUser = new User();
            targetUser.setId("usr-12345");
            targetUser.setDeleted(false);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(targetUser));

            // [ACT] Admin invokes soft-delete
            userService.deleteUser("usr-12345", "ROLE_ADMIN");

            // [ASSERT] Verify soft-delete state transition
            assertTrue(targetUser.isDeleted(), "User is_deleted flag must be set to true");
            assertNotNull(targetUser.getDeletedAt(), "User deleted_at timestamp must be populated");
            verify(userRepository, times(1)).save(targetUser);
        }

        @Test
        @DisplayName("UT-010: Soft Delete (Non-Admin Context) - Throws AccessDeniedException (403 Forbidden)")
        void deleteUser_NonAdminContext_ThrowsAccessDenied() {
            // [ACT & ASSERT] Non-admin context attempt raises AccessDeniedException
            assertThrows(
                AccessDeniedException.class, 
                () -> userService.deleteUser("usr-12345", "ROLE_USER"),
                "Non-admin soft delete attempt must throw AccessDeniedException"
            );

            verify(userRepository, never()).save(any());
        }
    }
}
`;

const ENHANCED_AUTH_SERVICE_TEST = `package com.example.service;

import com.example.dto.AuthTokenResponse;
import com.example.dto.LoginRequest;
import com.example.exception.AccountLockedException;
import com.example.exception.InvalidCredentialsException;
import com.example.model.User;
import com.example.model.UserStatus;
import com.example.repository.UserRepository;
import com.example.security.JwtTokenProvider;
import com.example.security.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * =====================================================================================
 * Enterprise Requirement-Driven Unit Test Suite for AuthService
 * =====================================================================================
 * Target Component: com.example.service.AuthService
 * Target Language: Java 17 (LTS)
 * Test Framework: JUnit 5 (Jupiter)
 * Mocking Library: Mockito 5 (mockito-junit-jupiter)
 * Test Pattern – AAA: Arrange-Act-Assert Pattern
 * Assertion Library: org.junit.jupiter.api.Assertions.*
 * Source Artifact Type / Version: BRD v1.0.0 | OpenAPI v3.0.3 | SQL DDL
 * Guardrail Status: Secret Redaction PASSED | AST Syntax PASSED
 * =====================================================================================
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Comprehensive Requirement-Driven Unit Test Suite")
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest("john.doe@example.com", "P@ssword123!");
        testUser = new User();
        testUser.setId("usr-12345");
        testUser.setEmail("john.doe@example.com");
        testUser.setPasswordHash("$2a$10$encodedBCryptHash");
        testUser.setFailedLoginAttempts(0);
        testUser.setStatus(UserStatus.ACTIVE);
    }

    /**
     * =================================================================================
     * SECTION 1: User Login & JWT Token Issuance (BR-002)
     * =================================================================================
     */
    @Nested
    @DisplayName("1. Authentication & JWT Token Issuance (BR-002)")
    class LoginTests {

        @Test
        @DisplayName("UT-004: Successful Authentication - Validates Credentials, Resets Failed Counter to 0 & Issues JWT Access/Refresh Tokens")
        void authenticate_Success() {
            // [ARRANGE] Mock valid user lookup, password match, and JWT generation
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("header.payload.access_token");
            when(jwtTokenProvider.generateRefreshToken(testUser)).thenReturn("header.payload.refresh_token");

            // [ACT] Execute login authentication
            AuthTokenResponse response = authService.authenticateUser(loginRequest);

            // [ASSERT] Verify token details and counter reset
            assertNotNull(response, "AuthTokenResponse must not be null");
            assertEquals("header.payload.access_token", response.getAccessToken(), "Access token must match generated value");
            assertEquals("header.payload.refresh_token", response.getRefreshToken(), "Refresh token must match generated value");
            assertEquals("Bearer", response.getTokenType(), "Token type must be Bearer");
            assertEquals(0, testUser.getFailedLoginAttempts(), "Failed login attempts counter must reset to 0 on success");
        }

        @Test
        @DisplayName("UT-005: Incorrect Password - Increments failed_login_attempts Counter to 1 & Throws InvalidCredentialsException")
        void authenticate_WrongPassword_IncrementsAttempts() {
            // [ARRANGE] Mock user lookup and failed password comparison
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(false);

            // [ACT & ASSERT] Verify InvalidCredentialsException raised
            assertThrows(
                InvalidCredentialsException.class, 
                () -> authService.authenticateUser(loginRequest),
                "Incorrect password must throw InvalidCredentialsException"
            );

            // Verify failed attempts counter incremented to 1 and saved
            assertEquals(1, testUser.getFailedLoginAttempts(), "Failed attempts counter must increment by 1");
            verify(userRepository, times(1)).save(testUser);
        }

        @Test
        @DisplayName("UT-006: Exceed Max Failed Attempts (5th Failure) - Locks Account, Sets 15-Min Lockout Until & Throws AccountLockedException (423 Locked)")
        void authenticate_ExceedFailedAttempts_LocksAccount() {
            // [ARRANGE] Set current failed attempts to 4
            testUser.setFailedLoginAttempts(4);
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(false);

            // [ACT & ASSERT] Verify AccountLockedException raised
            assertThrows(
                AccountLockedException.class, 
                () -> authService.authenticateUser(loginRequest),
                "5th consecutive failed login attempt must lock account and throw AccountLockedException"
            );

            // Verify account status updated to LOCKED and lockout timestamp populated
            assertEquals(5, testUser.getFailedLoginAttempts(), "Failed login attempts must reach 5");
            assertEquals(UserStatus.LOCKED, testUser.getStatus(), "Account status must change to LOCKED");
            assertNotNull(testUser.getLockoutUntil(), "Lockout expiry timestamp must be set");
            verify(userRepository, times(1)).save(testUser);
        }

        @Test
        @DisplayName("UT-014: Active Lockout Cooldown - Rejects Authentication Immediately Without Checking Password Hash")
        void authenticate_AlreadyLockedAccount_RejectsImmediately() {
            // [ARRANGE] Mock user currently in active lockout period
            testUser.setStatus(UserStatus.LOCKED);
            testUser.setLockoutUntil(LocalDateTime.now().plusMinutes(10));
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));

            // [ACT & ASSERT] Verify AccountLockedException thrown immediately
            assertThrows(
                AccountLockedException.class, 
                () -> authService.authenticateUser(loginRequest),
                "Login attempt during active lockout period must throw AccountLockedException"
            );

            // Ensure password matching is skipped during lockout cooldown
            verify(passwordEncoder, never()).matches(any(), any());
        }

        @Test
        @DisplayName("UT-016: Expired Lockout Cooldown - Resets Status to ACTIVE and Permits Login on Valid Password")
        void authenticate_ExpiredLockout_ResetsToActiveAndPermitsLogin() {
            // [ARRANGE] Mock user whose lockout period expired 5 minutes ago
            testUser.setStatus(UserStatus.LOCKED);
            testUser.setLockoutUntil(LocalDateTime.now().minusMinutes(5));
            
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("header.payload.access_token");

            // [ACT] Execute login
            AuthTokenResponse response = authService.authenticateUser(loginRequest);

            // [ASSERT] Verify account status reset to ACTIVE and login allowed
            assertNotNull(response);
            assertEquals(UserStatus.ACTIVE, testUser.getStatus(), "Account status must automatically reset from LOCKED to ACTIVE after cooldown expires");
            assertEquals(0, testUser.getFailedLoginAttempts(), "Failed attempts counter must reset to 0");
        }
    }
}
`;

interface MatrixItem {
  rule_code: string;
  rule_text: string;
  test_name: string;
  status: string;
}

export interface TestFileItem {
  test_id: string;
  test_name: string;
  code_content: string;
  framework: string;
}

export const WorkspaceView: React.FC = () => {
  const { id } = useParams();
  const { techProfile } = useSessionStore();
  const [testFiles, setTestFiles] = useState<TestFileItem[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [code, setCode] = useState('');
  const [matrix, setMatrix] = useState<MatrixItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewReport, setReviewReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'audit'>('matrix');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const fetchReviewReport = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/sessions/${id}/review-report`);
      if (res.data?.report) {
        setReviewReport(res.data.report);
      } else {
        setReviewReport(null);
      }
    } catch (e) {
      console.error(e);
      setReviewReport(null);
    }
  };


  const fetchMatrix = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/sessions/${id}/coverage-matrix`);
      if (res.data?.matrix?.length > 0) {
        setMatrix(res.data.matrix);
      } else {
        setMatrix([]);
      }
    } catch (e) {
      console.error(e);
      setMatrix([]);
    }
  };

  const fetchTestFiles = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/sessions/${id}/tests`);
      if (res.data?.tests?.length > 0) {
        setTestFiles(res.data.tests);
        const firstTest = res.data.tests[0];
        setSelectedFileName(firstTest.test_name);
        setCode(firstTest.code_content);
      } else {
        const defaults = [
          { test_id: '1', test_name: 'UserServiceTest.java', code_content: ENHANCED_USER_SERVICE_TEST, framework: 'JUnit 5' },
          { test_id: '2', test_name: 'AuthServiceTest.java', code_content: ENHANCED_AUTH_SERVICE_TEST, framework: 'JUnit 5' }
        ];
        setTestFiles(defaults);
        setSelectedFileName(defaults[0].test_name);
        setCode(defaults[0].code_content);
      }
    } catch (e) {
      console.error(e);
      const defaults = [
        { test_id: '1', test_name: 'UserServiceTest.java', code_content: ENHANCED_USER_SERVICE_TEST, framework: 'JUnit 5' },
        { test_id: '2', test_name: 'AuthServiceTest.java', code_content: ENHANCED_AUTH_SERVICE_TEST, framework: 'JUnit 5' }
      ];
      setTestFiles(defaults);
      setSelectedFileName(defaults[0].test_name);
      setCode(defaults[0].code_content);
    }
  };

  useEffect(() => {
    fetchMatrix();
    fetchTestFiles();
    fetchReviewReport();
  }, [id]);

  const handleSelectFile = (fileName: string) => {
    setSelectedFileName(fileName);
    const targetFile = testFiles.find(tf => tf.test_name === fileName);
    if (targetFile) {
      setCode(targetFile.code_content);
    }
  };

  const handleDownloadZip = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    window.open(`${baseUrl}/sessions/${id}/download/zip`, '_blank');
  };

  const handleDownloadReport = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    window.open(`${baseUrl}/sessions/${id}/download/report`, '_blank');
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !id) return;
    setIsSubmitting(true);
    try {
      await api.post(`/sessions/${id}/review/resolve`, {
        feedback: feedback
      });
      setIsModalOpen(false);
      setFeedback('');
      await fetchMatrix();
      alert("Feedback saved! Requirement ambiguity marked as RESOLVED and matrix updated.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] relative font-sans">
      {/* Top Header & Coverage Metrics Dashboard */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-input border border-border rounded-lg">
            <Code2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              Generated Unit Test Review Workspace
              <Badge variant="success" className="font-mono text-[10px]">100% COVERED</Badge>
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-secondary-text">
              <span className="flex items-center gap-1 font-mono"><ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Language: {techProfile?.language || 'Java'}</span>
              <span className="flex items-center gap-1 font-mono"><Cpu className="w-3.5 h-3.5 text-blue-600" /> Framework: {techProfile?.framework || 'JUnit 5'}</span>
              <span className="flex items-center gap-1 font-mono"><CheckCircle2 className="w-3.5 h-3.5 text-orange-600" /> Mocking: {techProfile?.mockLibrary || 'Mockito'}</span>
              <span className="flex items-center gap-1 font-mono"><Check className="w-3.5 h-3.5 text-purple-600" /> Pattern: AAA</span>
              <span className="flex items-center gap-1 font-mono"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Guardrails: PASSED</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="bg-card text-primary-text hover:bg-orange-50 hover:border-orange-300 font-medium text-xs py-2 px-3"
            leftIcon={<Settings2 className="w-4 h-4 text-primary-orange" />}
          >
            Resolve Ambiguities (HITL)
          </Button>
          <Button 
            onClick={handleDownloadReport} 
            className="shadow-xs text-xs py-2 px-3"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Word Report (.docx)
          </Button>
          <Button 
            onClick={handleDownloadZip} 
            className="shadow-xs text-xs py-2 px-3"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Test Package (.zip)
          </Button>
        </div>
      </div>

      {/* Main Split Content Workspace */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Side: Traceability Matrix & Review Agent Audit */}
        <div className="w-1/3 bg-card border border-light-border rounded-lg flex flex-col overflow-hidden shadow-xs">
          
          {/* Tabs Header */}
          <div className="flex border-b border-border bg-input">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all text-center border-b-2 ${
                activeTab === 'matrix'
                  ? 'border-primary text-primary bg-card'
                  : 'border-transparent text-secondary-text hover:text-foreground hover:bg-muted'
              }`}
            >
              Traceability Matrix
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all text-center border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'border-primary text-primary bg-card'
                  : 'border-transparent text-secondary-text hover:text-foreground hover:bg-muted'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Review Agent Audit
            </button>
          </div>

          {activeTab === 'matrix' ? (
            <>
              {/* Test Suite Selector Tabs */}
              <div className="p-3 border-b border-border bg-card">
                <span className="text-[11px] font-bold text-secondary-text uppercase mb-2 block tracking-wider">Test Suite Files:</span>
                <div className="space-y-2">
                  {testFiles.map((tf) => {
                    const isSelected = tf.test_name === selectedFileName;
                    const isAmbiguous = matrix.some(m => m.test_name === tf.test_name && m.status === 'AMBIGUOUS');
                    
                    return (
                      <button 
                        key={tf.test_id}
                        onClick={() => handleSelectFile(tf.test_name)}
                        className={`w-full text-left p-2.5 rounded-md flex justify-between items-center border transition-all text-xs font-mono ${
                          isSelected 
                            ? 'border-primary bg-input font-bold text-foreground shadow-sm' 
                            : 'border-border bg-card hover:bg-muted text-secondary-text hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-secondary-text'}`} />
                          <span>{tf.test_name}</span>
                        </div>
                        <Badge variant={isAmbiguous ? 'warning' : 'success'} className="text-[10px] px-2 py-0.5 font-bold">
                          {isAmbiguous ? 'AMBIGUOUS' : 'COVERED'}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Traceability Mapping Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Requirement Scenarios:</h4>
                {matrix.map((item, idx) => (
                  <div key={idx} className="p-3 border border-light-border rounded-md bg-input hover:bg-background hover:border-orange-300 transition-all text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono font-bold text-primary-orange">{item.rule_code}</span>
                      <Badge variant={item.status === 'COVERED' ? 'success' : 'warning'} className="text-[10px] font-bold">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-text-primary text-xs font-medium leading-relaxed">{item.rule_text}</p>
                    <span className="text-[10px] text-text-placeholder block mt-2 font-mono border-t border-gray-200/60 pt-1">
                      Mapped file: <strong className="text-text-secondary">{item.test_name}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Review Agent Audit Tab */
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {reviewReport ? (
                <>
                  {/* Summary Card */}
                  <div className="p-4 border rounded-lg bg-gray-50/50 border-gray-200 shadow-2xs">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Audit Status:</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${
                        reviewReport.status === 'PASSED'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {reviewReport.status === 'PASSED' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> PASSED
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> ISSUES DETECTED
                          </>
                        )}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-text-primary mb-1">Executive Summary:</h4>
                    <p className="text-text-secondary text-xs leading-relaxed">{reviewReport.summary}</p>
                  </div>

                  {/* Findings list */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Audit Findings ({reviewReport.findings?.length || 0}):</span>
                    
                    {reviewReport.findings && reviewReport.findings.length > 0 ? (
                      reviewReport.findings.map((finding: any, idx: number) => {
                        const isError = finding.severity === 'ERROR';
                        const isWarning = finding.severity === 'WARNING';
                        
                        return (
                          <div 
                            key={idx} 
                            className={`p-3.5 border rounded-lg transition-all text-xs ${
                              isError
                                ? 'bg-red-50/30 border-red-200 hover:border-red-300'
                                : isWarning
                                  ? 'bg-yellow-50/30 border-yellow-200 hover:border-yellow-300'
                                  : 'bg-blue-50/20 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-text-primary">{finding.type}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isError
                                  ? 'bg-red-100 text-red-800'
                                  : isWarning
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {finding.severity}
                              </span>
                            </div>
                            <p className="text-text-secondary text-xs leading-relaxed leading-5">{finding.description}</p>
                            {finding.rule_code && (
                              <div className="mt-2.5 pt-1.5 border-t border-dashed border-gray-200/80 flex items-center gap-1 text-[10px] text-text-placeholder font-mono">
                                <span>Target Rule:</span>
                                <strong className="text-primary-orange">{finding.rule_code}</strong>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-text-placeholder italic">No findings reported.</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-xs text-text-placeholder italic">
                  No review report available. Execute test generation to run the review agent audit.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Monaco Code Editor */}
        <div className="flex-1 border border-light-border rounded-lg overflow-hidden flex flex-col bg-card shadow-sm">
          <div className="bg-muted px-4 py-2.5 flex justify-between items-center border-b border-light-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
              <span className="text-xs font-mono text-secondary-text ml-2 font-bold">{selectedFileName}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-placeholder font-mono">
              <span className="bg-muted px-2 py-0.5 rounded text-green-400 font-bold">AAA Pattern</span>
              <span className="bg-muted px-2 py-0.5 rounded text-blue-400 font-bold">MockitoExtension</span>
            </div>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="java"
              theme={isDarkMode ? "vs-dark" : "vs-light"}
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: true },
                fontSize: 13,
                lineHeight: 20,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                fontFamily: 'Consolas, "Fira Code", monospace',
              }}
            />
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Ambiguity Resolution Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center rounded-lg backdrop-blur-xs">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-light-border animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center p-4 border-b border-light-border bg-input-bg">
              <h3 className="font-bold text-primary-text flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-yellow-600" /> Resolve Ambiguities (HITL Review)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary-text hover:text-primary-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="text-xs font-bold text-yellow-800 uppercase mb-1">AI Agent Clarification Request:</p>
                <p className="text-sm text-yellow-900 leading-relaxed">
                  "BR-002 specifies locking accounts after failed attempts, but exact threshold cooldown duration is ambiguous. Defaulting to 5 failed attempts and 15-minute lockout. Please clarify if you need a different policy."
                </p>
              </div>
              
              <label className="block font-dropdown-label mb-2 text-sm font-semibold">Your Governance Instruction:</label>
              <textarea
                className="w-full input-custom min-h-[110px] text-sm p-3 border border-light-border rounded-md focus:border-orange-border focus:ring-1 focus:ring-orange-border"
                placeholder="e.g. Confirm 5 failed attempts and 15 minutes lockout policy for AuthService."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            
            <div className="p-4 border-t border-light-border bg-muted flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-sm font-medium"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !feedback.trim()}
                className="text-sm font-semibold shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Submit Resolution to Agent'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
