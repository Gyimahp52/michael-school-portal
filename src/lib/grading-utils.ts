/**
 * Grading Utilities
 * Calculate grades, comments, and performance levels based on scores
 */

export interface GradeResult {
  grade: string;
  comment: string;
  performance: 'excellent' | 'very-good' | 'good' | 'average' | 'poor' | 'fail';
}

/**
 * Calculate grade based on percentage score
 */
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 40) return 'E';
  return 'F';
};

/**
 * Get performance level based on grade
 */
export const getPerformanceLevel = (grade: string): GradeResult['performance'] => {
  switch (grade) {
    case 'A':
      return 'excellent';
    case 'B':
      return 'very-good';
    case 'C':
      return 'good';
    case 'D':
      return 'average';
    case 'E':
      return 'poor';
    default:
      return 'fail';
  }
};

/**
 * Generate auto-comment based on performance
 */
export const generateComment = (percentage: number, grade: string): string => {
  const performance = getPerformanceLevel(grade);
  
  const comments: Record<GradeResult['performance'], string[]> = {
    'excellent': [
      'Outstanding performance! Keep up the excellent work.',
      'Exceptional work! You have shown great mastery.',
      'Excellent! Your dedication is commendable.'
    ],
    'very-good': [
      'Very good work! Continue with this effort.',
      'Great job! You are doing well.',
      'Well done! Keep improving.'
    ],
    'good': [
      'Good work! You are on the right track.',
      'Good effort. Keep working hard.',
      'Nice work! Continue to improve.'
    ],
    'average': [
      'Fair performance. More effort needed.',
      'You can do better with more practice.',
      'Average work. Focus on improvement areas.'
    ],
    'poor': [
      'Needs improvement. Please seek extra help.',
      'Below average. More effort is required.',
      'Requires attention. Please work harder.'
    ],
    'fail': [
      'Needs significant improvement. Seek help immediately.',
      'Poor performance. Immediate attention required.',
      'Failing grade. Extra lessons recommended.'
    ]
  };
  
  const commentList = comments[performance];
  return commentList[Math.floor(Math.random() * commentList.length)];
};

/**
 * Calculate complete grade result with auto-comment
 */
export const calculateGradeResult = (classwork: number, exam: number): GradeResult => {
  const total = classwork + exam;
  const percentage = total;
  const grade = calculateGrade(percentage);
  const comment = generateComment(percentage, grade);
  const performance = getPerformanceLevel(grade);
  
  return { grade, comment, performance };
};

/**
 * Validate score input
 */
export const validateScore = (score: number, maxScore: number): { valid: boolean; message?: string } => {
  if (isNaN(score)) {
    return { valid: false, message: 'Score must be a number' };
  }
  if (score < 0) {
    return { valid: false, message: 'Score cannot be negative' };
  }
  if (score > maxScore) {
    return { valid: false, message: `Score cannot exceed ${maxScore}` };
  }
  return { valid: true };
};
