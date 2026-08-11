import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Download, Settings2, X } from 'lucide-react';
import api from '../services/api';

const USER_SERVICE_TEST_CODE = `package com.example.service;

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
 * Enterprise Unit Test Suite for UserService
 * =====================================================================================
 * Target Service: com.example.service.UserService
 * Framework: JUnit 5 (Jupiter), Mockito 5
 * Pattern: Arrange-Act-Assert (AAA)
 * 
 * Traceability Matrix Coverage:
 * - BR-001: User Registration, Email Uniqueness, Password Regex & Async Notifications
 * - BR-003: Profile Retrieval, Phone Number E.164 Regex & Immutable Field Restrictions
 * - BR-004: Soft Deletion, Timestamping & RBAC Role-Based Access Control
 * =====================================================================================
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Comprehensive Unit Test Suite")
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
        // Initialize default valid request object before each test execution
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

        @Test
        @DisplayName("UT-001: Successful Registration - Unique Email, BCrypt Password Encoding, Default PENDING_VERIFICATION Status & Email Trigger")
        void registerUser_Success() {
            // [ARRANGE] Mock repository to return empty optional (email does not exist)
            when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("$2a$10$encodedBCryptHash");
            
            User savedUser = new User();
            savedUser.setId("usr-12345");
            savedUser.setEmail(validRequest.getEmail());
            savedUser.setStatus(UserStatus.PENDING_VERIFICATION);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // [ACT] Execute user registration logic
            UserResponse response = userService.registerUser(validRequest);

            // [ASSERT] Verify returned DTO properties and state transitions
            assertNotNull(response, "UserResponse should not be null on successful registration");
            assertEquals(validRequest.getEmail(), response.getEmail(), "Returned email must match request email");
            assertEquals(UserStatus.PENDING_VERIFICATION, response.getStatus(), "Initial account status must be PENDING_VERIFICATION");

            // Capture the User object passed to userRepository.save() to verify password encoding
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository, times(1)).save(userCaptor.capture());
            assertEquals("$2a$10$encodedBCryptHash", userCaptor.getValue().getPasswordHash(), "Plaintext password must be BCrypt hashed before persistence");

            // Verify asynchronous verification email notification was dispatched exactly once
            verify(notificationClient, times(1)).sendVerificationEmail(any(User.class));
        }

        @Test
        @DisplayName("UT-002: Duplicate Email Rejection - Throws DuplicateEmailException (409 Conflict) and Prevents DB Save")
        void registerUser_DuplicateEmail_ThrowsException() {
            // [ARRANGE] Mock existing user in database with the same email address
            User existingUser = new User();
            existingUser.setEmail(validRequest.getEmail());
            when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.of(existingUser));

            // [ACT & ASSERT] Verify exception thrown when attempting registration
            DuplicateEmailException exception = assertThrows(
                DuplicateEmailException.class, 
                () -> userService.registerUser(validRequest),
                "Should throw DuplicateEmailException when email already exists"
            );

            assertTrue(exception.getMessage().contains(validRequest.getEmail()), "Exception message should reference duplicate email");

            // Ensure database save and notification methods are NEVER invoked
            verify(userRepository, never()).save(any());
            verify(notificationClient, never()).sendVerificationEmail(any());
        }

        @ParameterizedTest(name = "UT-003: Weak Password '{0}' - Throws WeakPasswordException (400 Bad Request)")
        @ValueSource(strings = {
            "short1!",              // Rule: Min 8 chars (Fails length constraint)
            "no_uppercase_123!",    // Rule: Min 1 uppercase letter (Fails uppercase rule)
            "NO_LOWERCASE_123!",    // Rule: Min 1 lowercase letter (Fails lowercase rule)
            "NoSpecialChar123",     // Rule: Min 1 special char (Fails special char rule)
            "NoDigits!@#$"           // Rule: Min 1 numeric digit (Fails digit rule)
        })
        void registerUser_WeakPasswordVariants_ThrowsException(String weakPassword) {
            // [ARRANGE] Set weak password variant
            validRequest.setPassword(weakPassword);

            // [ACT & ASSERT] Verify WeakPasswordException is raised
            assertThrows(
                WeakPasswordException.class, 
                () -> userService.registerUser(validRequest),
                "Password failing security regex policy must raise WeakPasswordException"
            );

            // Ensure database save is never executed for invalid passwords
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
                "Emails failing RFC 5322 regex validation must raise InvalidInputException"
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
        @DisplayName("UT-007: Fetch Active Profile - Returns User Profile DTO for valid user ID")
        void getUserById_Success() {
            // [ARRANGE] Mock active non-deleted user in repository
            User activeUser = new User();
            activeUser.setId("usr-12345");
            activeUser.setEmail("john.doe@example.com");
            activeUser.setFirstName("John");
            activeUser.setLastName("Doe");
            activeUser.setDeleted(false);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(activeUser));

            // [ACT] Fetch user profile by ID
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
            // [ARRANGE] Mock user marked as deleted (is_deleted = true)
            User deletedUser = new User();
            deletedUser.setId("usr-12345");
            deletedUser.setDeleted(true);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(deletedUser));

            // [ACT & ASSERT] Soft-deleted users must not be accessible via standard lookup
            assertThrows(
                UserNotFoundException.class, 
                () -> userService.getUserById("usr-12345"),
                "Lookup for soft-deleted user must throw UserNotFoundException"
            );
        }

        @Test
        @DisplayName("UT-011: Profile Update - Updates First Name and Valid E.164 Phone Number Successfully")
        void updateProfile_ValidPhoneNumber_Success() {
            // [ARRANGE] Mock existing active user
            User existingUser = new User();
            existingUser.setId("usr-12345");
            existingUser.setFirstName("John");
            existingUser.setLastName("Doe");

            UpdateProfileRequest updateReq = new UpdateProfileRequest();
            updateReq.setFirstName("Johnathan");
            updateReq.setLastName("Doe");
            updateReq.setPhoneNumber("+14155552671"); // Valid E.164 format

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // [ACT] Update profile
            UserResponse updated = userService.updateProfile("usr-12345", updateReq);

            // [ASSERT] Verify updated values persisted
            assertEquals("Johnathan", updated.getFirstName());
            assertEquals("+14155552671", updated.getPhoneNumber());
            verify(userRepository, times(1)).save(existingUser);
        }

        @Test
        @DisplayName("UT-012: Profile Update Invalid Phone - Throws InvalidInputException for Non-E.164 Phone Format")
        void updateProfile_InvalidPhoneNumber_ThrowsException() {
            // [ARRANGE] Mock existing active user
            User existingUser = new User();
            existingUser.setId("usr-12345");

            UpdateProfileRequest updateReq = new UpdateProfileRequest();
            updateReq.setPhoneNumber("123-abc-invalid-format"); // Non E.164 string

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(existingUser));

            // [ACT & ASSERT] Verify phone number regex failure raises InvalidInputException
            assertThrows(
                InvalidInputException.class, 
                () -> userService.updateProfile("usr-12345", updateReq),
                "Invalid phone format must throw InvalidInputException"
            );

            // DB save must be skipped
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

            // Ensure database save is never executed
            verify(userRepository, never()).save(any());
        }
    }
}
`;

const AUTH_SERVICE_TEST_CODE = `package com.example.service;

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
 * Enterprise Unit Test Suite for AuthService
 * =====================================================================================
 * Target Service: com.example.service.AuthService
 * Framework: JUnit 5 (Jupiter), Mockito 5
 * Pattern: Arrange-Act-Assert (AAA)
 * 
 * Traceability Matrix Coverage:
 * - BR-002: Credential Verification, Account Lockout Policy (5 failed attempts),
 *           Lockout Cooldown Expiration & JWT Bearer Token Issuance
 * =====================================================================================
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Comprehensive Unit Test Suite")
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
            assertEquals(3600, response.getExpiresIn(), "Access token TTL must be 3600 seconds");
            assertEquals(0, testUser.getFailedLoginAttempts(), "Failed login attempts counter must reset to 0 on success");
        }

        @Test
        @DisplayName("UT-005: Incorrect Password - Increments failed_login_attempts Counter to 1 & Throws InvalidCredentialsException")
        void authenticate_WrongPassword_IncrementsAttempts() {
            // [ARRANGE] Mock user lookup and failed BCrypt password comparison
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
            // [ARRANGE] Set current failed attempts to 4 (so next failure triggers lockout threshold)
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
            // [ARRANGE] Mock user currently in active lockout period (lockout_until = now + 10 mins)
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

export const WorkspaceView: React.FC = () => {
  const { id } = useParams();
  const [selectedFile, setSelectedFile] = useState<'UserServiceTest.java' | 'AuthServiceTest.java'>('UserServiceTest.java');
  const [code, setCode] = useState(USER_SERVICE_TEST_CODE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectFile = (fileName: 'UserServiceTest.java' | 'AuthServiceTest.java') => {
    setSelectedFile(fileName);
    if (fileName === 'UserServiceTest.java') {
      setCode(USER_SERVICE_TEST_CODE);
    } else {
      setCode(AUTH_SERVICE_TEST_CODE);
    }
  };

  const handleDownloadZip = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/sessions/${id}/download/zip`, '_blank');
  };

  const handleDownloadReport = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/sessions/${id}/download/report`, '_blank');
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/sessions/${id}/review/resolve`, {
        feedback: feedback
      });
      setIsModalOpen(false);
      setFeedback('');
      alert("Feedback saved! AI will regenerate tests based on your instructions.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col h-[calc(100vh-120px)] relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-main-heading">Test Review Workspace</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-orange flex items-center gap-2 bg-white text-text-primary border border-light-border hover:bg-gray-50"
          >
            <Settings2 className="w-4 h-4" /> Resolve Ambiguities
          </button>
          <button onClick={handleDownloadReport} className="btn-orange flex items-center gap-2">
            <Download className="w-4 h-4" /> Word Report
          </button>
          <button onClick={handleDownloadZip} className="btn-orange flex items-center gap-2">
            <Download className="w-4 h-4" /> Export ZIP
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Sidebar: Matrix & Files */}
        <div className="w-1/3 bg-white border border-light-border rounded flex flex-col overflow-hidden">
          <div className="p-3 border-b border-light-border bg-input-bg">
            <h3 className="font-dropdown-label text-text-primary font-bold">Traceability Matrix</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-2 text-sm">
              <li 
                onClick={() => handleSelectFile('UserServiceTest.java')}
                className={`flex justify-between items-center p-2 rounded cursor-pointer border ${
                  selectedFile === 'UserServiceTest.java' ? 'border-orange-400 bg-orange-50 font-bold' : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <span>UserServiceTest.java</span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">COVERED</span>
              </li>
              <li 
                onClick={() => handleSelectFile('AuthServiceTest.java')}
                className={`flex justify-between items-center p-2 rounded cursor-pointer border ${
                  selectedFile === 'AuthServiceTest.java' ? 'border-yellow-400 bg-yellow-50 font-bold' : 'hover:bg-red-50 border-red-200 bg-red-50'
                }`}
              >
                <span>AuthServiceTest.java</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">AMBIGUOUS</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Sidebar: Monaco Editor */}
        <div className="flex-1 border border-light-border rounded overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="java"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Resolve Ambiguities Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-light-border">
            <div className="flex justify-between items-center p-4 border-b border-light-border bg-input-bg">
              <h3 className="font-bold text-text-primary">Resolve Ambiguities (Human-in-the-Loop)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
                <p className="text-sm text-yellow-800 font-semibold mb-1">AI Agent Question:</p>
                <p className="text-sm text-yellow-900">"The requirement states 'Block user after multiple failed attempts', but it does not specify how many attempts. Please clarify."</p>
              </div>
              
              <label className="block font-dropdown-label mb-2">Your Instruction:</label>
              <textarea
                className="w-full input-custom min-h-[100px] text-sm"
                placeholder="e.g. Block the user after 3 failed attempts."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            
            <div className="p-4 border-t border-light-border bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-text-primary border border-light-border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !feedback.trim()}
                className="btn-orange disabled:opacity-50 text-sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
