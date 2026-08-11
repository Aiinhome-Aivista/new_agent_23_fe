export interface TechProfile {
  language: string;
  framework: string;
  mockLibrary: string;
  version: string;
  codingStandard?: string;
  gitRepo?: string;
}

export interface Session {
  session_id: string;
  status: 'INITIALIZED' | 'DECOMPOSED' | 'AWAITING_APPROVAL' | 'GENERATING' | 'COMPLETED' | 'ERROR';
  tech_profile?: TechProfile;
}

export interface ServiceContract {
  service_id: string;
  name: string;
  methods: any[];
  dependencies: any[];
  status: 'PROPOSED' | 'APPROVED';
}

export interface UnitTest {
  test_id: string;
  service_id: string;
  test_name: string;
  code_content: string;
  target_rule_ids: string[];
  framework: string;
}

export interface CoverageMatrixEntry {
  audit_id: string;
  req_id: string;
  test_id?: string;
  status: 'COVERED' | 'GAP' | 'AMBIGUOUS';
  reviewer_decision?: string;
}
