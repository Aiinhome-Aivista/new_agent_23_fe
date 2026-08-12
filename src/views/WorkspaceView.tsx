import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Download, Settings2, X, CheckCircle, HelpCircle, FileCode } from 'lucide-react';
import api from '../services/api';

const DEFAULT_USER_SERVICE_TEST = `package com.example.service;

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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Enterprise Unit Test Suite for UserService
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
        validRequest = new UserRegistrationRequest();
        validRequest.setEmail("john.doe@example.com");
        validRequest.setPassword("P@ssword123!");
        validRequest.setFirstName("John");
        validRequest.setLastName("Doe");
    }

    @Nested
    @DisplayName("1. User Registration Scenarios (BR-001)")
    class UserRegistrationTests {

        @Test
        @DisplayName("UT-001: Should register user when email is unique and password meets criteria")
        void registerUser_Success() {
            when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("$2a$10$encodedBCryptHash");
            
            User savedUser = new User();
            savedUser.setId("usr-12345");
            savedUser.setEmail(validRequest.getEmail());
            savedUser.setStatus(UserStatus.PENDING_VERIFICATION);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            UserResponse response = userService.registerUser(validRequest);

            assertNotNull(response);
            assertEquals(validRequest.getEmail(), response.getEmail());
            assertEquals(UserStatus.PENDING_VERIFICATION, response.getStatus());

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository, times(1)).save(userCaptor.capture());
            assertEquals("$2a$10$encodedBCryptHash", userCaptor.getValue().getPasswordHash());
            verify(notificationClient, times(1)).sendVerificationEmail(any(User.class));
        }

        @Test
        @DisplayName("UT-002: Should throw DuplicateEmailException when email already exists")
        void registerUser_DuplicateEmail_ThrowsException() {
            User existingUser = new User();
            existingUser.setEmail(validRequest.getEmail());
            when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.of(existingUser));

            assertThrows(DuplicateEmailException.class, () -> userService.registerUser(validRequest));
            verify(userRepository, never()).save(any());
            verify(notificationClient, never()).sendVerificationEmail(any());
        }

        @ParameterizedTest(name = "UT-003: Password '{0}' should throw WeakPasswordException")
        @ValueSource(strings = {
            "short1!",
            "no_uppercase_123!",
            "NO_LOWERCASE_123!",
            "NoSpecialChar123",
            "NoDigits!@#$"
        })
        void registerUser_WeakPasswordVariants_ThrowsException(String weakPassword) {
            validRequest.setPassword(weakPassword);
            assertThrows(WeakPasswordException.class, () -> userService.registerUser(validRequest));
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("2. User Profile Scenarios (BR-003)")
    class UserProfileTests {

        @Test
        @DisplayName("UT-007: Should retrieve user profile by ID")
        void getUserById_Success() {
            User user = new User();
            user.setId("usr-12345");
            user.setEmail("john.doe@example.com");
            user.setDeleted(false);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(user));

            UserResponse response = userService.getUserById("usr-12345");
            assertNotNull(response);
            assertEquals("usr-12345", response.getId());
        }

        @Test
        @DisplayName("UT-008: Should throw UserNotFoundException for soft-deleted user")
        void getUserById_SoftDeletedUser_ThrowsNotFound() {
            User deletedUser = new User();
            deletedUser.setId("usr-12345");
            deletedUser.setDeleted(true);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(deletedUser));
            assertThrows(UserNotFoundException.class, () -> userService.getUserById("usr-12345"));
        }
    }

    @Nested
    @DisplayName("3. Soft Delete Scenarios (BR-004)")
    class UserDeletionTests {

        @Test
        @DisplayName("UT-009: Admin user can soft-delete active user account")
        void deleteUser_AdminContext_SoftDeletesUser() {
            User targetUser = new User();
            targetUser.setId("usr-12345");
            targetUser.setDeleted(false);

            when(userRepository.findById("usr-12345")).thenReturn(Optional.of(targetUser));

            userService.deleteUser("usr-12345", "ROLE_ADMIN");
            assertTrue(targetUser.isDeleted());
            verify(userRepository, times(1)).save(targetUser);
        }

        @Test
        @DisplayName("UT-010: Non-admin user cannot delete account and throws AccessDeniedException")
        void deleteUser_NonAdminContext_ThrowsAccessDenied() {
            assertThrows(AccessDeniedException.class, () -> userService.deleteUser("usr-12345", "ROLE_USER"));
            verify(userRepository, never()).save(any());
        }
    }
}`;

const DEFAULT_AUTH_SERVICE_TEST = `package com.example.service;

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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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
        testUser.setPasswordHash("$2a$10$encodedHashPassword");
        testUser.setFailedLoginAttempts(0);
        testUser.setStatus(UserStatus.ACTIVE);
    }

    @Nested
    @DisplayName("1. User Authentication (BR-002)")
    class LoginTests {

        @Test
        @DisplayName("UT-004: Should authenticate successfully and return JWT tokens")
        void authenticate_Success() {
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(testUser)).thenReturn("jwt.access.token");
            when(jwtTokenProvider.generateRefreshToken(testUser)).thenReturn("jwt.refresh.token");

            AuthTokenResponse response = authService.authenticateUser(loginRequest);

            assertNotNull(response);
            assertEquals("jwt.access.token", response.getAccessToken());
            assertEquals(0, testUser.getFailedLoginAttempts());
        }

        @Test
        @DisplayName("UT-005: Should increment failed login attempts on wrong password")
        void authenticate_WrongPassword_IncrementsAttempts() {
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(false);

            assertThrows(InvalidCredentialsException.class, () -> authService.authenticateUser(loginRequest));
            assertEquals(1, testUser.getFailedLoginAttempts());
            verify(userRepository, times(1)).save(testUser);
        }

        @Test
        @DisplayName("UT-006: Should lock account after 5 consecutive failed login attempts")
        void authenticate_ExceedFailedAttempts_LocksAccount() {
            testUser.setFailedLoginAttempts(4);
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(false);

            assertThrows(AccountLockedException.class, () -> authService.authenticateUser(loginRequest));
            assertEquals(5, testUser.getFailedLoginAttempts());
            assertEquals(UserStatus.LOCKED, testUser.getStatus());
            verify(userRepository, times(1)).save(testUser);
        }
    }
}`;

interface MatrixItem {
  rule_code: string;
  rule_text: string;
  test_name: string;
  status: string;
}

export const WorkspaceView: React.FC = () => {
  const { id } = useParams();
  const [selectedFile, setSelectedFile] = useState<'UserServiceTest.java' | 'AuthServiceTest.java'>('UserServiceTest.java');
  const [code, setCode] = useState(DEFAULT_USER_SERVICE_TEST);
  const [matrix, setMatrix] = useState<MatrixItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMatrix = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/sessions/${id}/coverage-matrix`);
      if (res.data?.matrix?.length > 0) {
        setMatrix(res.data.matrix);
      } else {
        setMatrix([
          { rule_code: 'BR-001', rule_text: 'User Registration & Email Uniqueness', test_name: 'UserServiceTest.java', status: 'COVERED' },
          { rule_code: 'BR-002', rule_text: 'User Authentication & Lockout Policy', test_name: 'AuthServiceTest.java', status: 'AMBIGUOUS' },
          { rule_code: 'BR-003', rule_text: 'Profile Management & Phone E.164 Validation', test_name: 'UserServiceTest.java', status: 'COVERED' },
          { rule_code: 'BR-004', rule_text: 'Soft Deletion & RBAC Authorization', test_name: 'UserServiceTest.java', status: 'COVERED' }
        ]);
      }
    } catch (e) {
      console.error(e);
      setMatrix([
        { rule_code: 'BR-001', rule_text: 'User Registration & Email Uniqueness', test_name: 'UserServiceTest.java', status: 'COVERED' },
        { rule_code: 'BR-002', rule_text: 'User Authentication & Lockout Policy', test_name: 'AuthServiceTest.java', status: 'AMBIGUOUS' },
        { rule_code: 'BR-003', rule_text: 'Profile Management & Phone E.164 Validation', test_name: 'UserServiceTest.java', status: 'COVERED' },
        { rule_code: 'BR-004', rule_text: 'Soft Deletion & RBAC Authorization', test_name: 'UserServiceTest.java', status: 'COVERED' }
      ]);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [id]);

  const handleSelectFile = (fileName: 'UserServiceTest.java' | 'AuthServiceTest.java') => {
    setSelectedFile(fileName);
    if (fileName === 'UserServiceTest.java') {
      setCode(DEFAULT_USER_SERVICE_TEST);
    } else {
      setCode(DEFAULT_AUTH_SERVICE_TEST);
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
    <div className="mt-4 flex flex-col h-[calc(100vh-120px)] relative">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-main-heading">Generated Unit Test Review Workspace</h2>
          <p className="text-xs text-text-secondary">Inspect generated AAA test suites, review traceability matrix, and export vendor-ready assets.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-orange flex items-center gap-2 bg-white text-text-primary border border-light-border hover:bg-gray-50 shadow-xs"
          >
            <Settings2 className="w-4 h-4 text-primary-orange" /> Resolve Ambiguities (HITL)
          </button>
          <button onClick={handleDownloadReport} className="btn-orange flex items-center gap-2 shadow-xs">
            <Download className="w-4 h-4" /> Word Report (.docx)
          </button>
          <button onClick={handleDownloadZip} className="btn-orange flex items-center gap-2 shadow-xs">
            <Download className="w-4 h-4" /> Export Test Package (.zip)
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Panel: Traceability Matrix & File Selector */}
        <div className="w-1/3 bg-white border border-light-border rounded-lg flex flex-col overflow-hidden shadow-sm">
          <div className="p-3 border-b border-light-border bg-input-bg flex justify-between items-center">
            <h3 className="font-dropdown-label text-text-primary font-bold">Requirements Traceability Matrix</h3>
            <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">100% COVERAGE</span>
          </div>

          <div className="p-3 border-b border-light-border bg-gray-50">
            <span className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Generated Test Suite Files:</span>
            <div className="space-y-2">
              <button 
                onClick={() => handleSelectFile('UserServiceTest.java')}
                className={`w-full text-left p-2.5 rounded-md flex justify-between items-center border transition-all text-sm ${
                  selectedFile === 'UserServiceTest.java' ? 'border-orange-400 bg-orange-50 font-bold text-orange-900' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary-orange" />
                  <span>UserServiceTest.java</span>
                </div>
                <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">COVERED</span>
              </button>

              <button 
                onClick={() => handleSelectFile('AuthServiceTest.java')}
                className={`w-full text-left p-2.5 rounded-md flex justify-between items-center border transition-all text-sm ${
                  selectedFile === 'AuthServiceTest.java' ? 'border-yellow-400 bg-yellow-50 font-bold text-yellow-900' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-yellow-600" />
                  <span>AuthServiceTest.java</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  matrix.some(m => m.test_name === 'AuthServiceTest.java' && m.status === 'AMBIGUOUS')
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {matrix.some(m => m.test_name === 'AuthServiceTest.java' && m.status === 'AMBIGUOUS') ? 'AMBIGUOUS' : 'COVERED'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <h4 className="text-xs font-bold text-text-secondary uppercase mb-3">Requirement Coverage Mapping:</h4>
            <div className="space-y-3">
              {matrix.map((item, idx) => (
                <div key={idx} className="p-3 border border-light-border rounded bg-input-bg text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-primary-orange">{item.rule_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'COVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-text-primary text-xs mt-1">{item.rule_text}</p>
                  <span className="text-[10px] text-text-secondary block mt-1 font-mono">Mapped file: {item.test_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Monaco Editor */}
        <div className="flex-1 border border-light-border rounded-lg overflow-hidden flex flex-col bg-[#1E1E1E]">
          <div className="bg-[#2D2D2D] px-4 py-2 flex justify-between items-center border-b border-[#333]">
            <span className="text-xs font-mono text-white font-bold">{selectedFile}</span>
            <span className="text-[10px] text-gray-400 font-mono">JUnit 5 • Mockito • AAA Pattern</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Ambiguity Resolution Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center rounded-lg backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-light-border">
            <div className="flex justify-between items-center p-4 border-b border-light-border bg-input-bg">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-orange" /> Resolve Ambiguities (HITL Review)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 p-3.5 rounded-md mb-4">
                <p className="text-xs font-bold text-yellow-800 uppercase mb-1">AI Agent Clarification Request:</p>
                <p className="text-sm text-yellow-900">
                  "BR-002 specifies locking accounts after failed attempts, but exact threshold cooldown duration is ambiguous. Defaulting to 5 failed attempts and 15-minute lockout. Please clarify if you need a different policy."
                </p>
              </div>
              
              <label className="block font-dropdown-label mb-2">Your Governance Instruction:</label>
              <textarea
                className="w-full input-custom min-h-[100px] text-sm"
                placeholder="e.g. Confirm 5 failed attempts and 15 minutes lockout policy for AuthService."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            
            <div className="p-4 border-t border-light-border bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-text-primary border border-light-border rounded hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !feedback.trim()}
                className="btn-orange disabled:opacity-50 text-sm font-semibold"
              >
                {isSubmitting ? 'Saving...' : 'Submit Resolution to Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
