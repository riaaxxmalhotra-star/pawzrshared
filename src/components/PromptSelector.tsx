import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import {
  FUN_PROMPTS,
  PRACTICAL_QUESTIONS,
  Prompt,
  PracticalQuestion,
  MIN_PROMPTS_REQUIRED,
  getPracticalQuestionsForRole,
} from '../config/prompts';

const { width } = Dimensions.get('window');

interface SelectedPrompt {
  promptId: string;
  prompt: string;
  answer: string;
}

interface PromptSelectorProps {
  role: 'OWNER' | 'LOVER';
  selectedPrompts: SelectedPrompt[];
  practicalAnswers: { [key: string]: string };
  onPromptsChange: (prompts: SelectedPrompt[]) => void;
  onPracticalAnswersChange: (answers: { [key: string]: string }) => void;
}

export default function PromptSelector({
  role,
  selectedPrompts,
  practicalAnswers,
  onPromptsChange,
  onPracticalAnswersChange,
}: PromptSelectorProps) {
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const practicalQuestions = getPracticalQuestionsForRole(role);

  const isPromptSelected = (promptId: string) => {
    return selectedPrompts.some((p) => p.promptId === promptId);
  };

  const getPromptAnswer = (promptId: string) => {
    return selectedPrompts.find((p) => p.promptId === promptId)?.answer || '';
  };

  const handlePromptSelect = (prompt: Prompt) => {
    if (isPromptSelected(prompt.id)) {
      // Remove prompt
      onPromptsChange(selectedPrompts.filter((p) => p.promptId !== prompt.id));
      if (expandedPromptId === prompt.id) {
        setExpandedPromptId(null);
      }
    } else if (selectedPrompts.length < MIN_PROMPTS_REQUIRED) {
      // Add prompt
      onPromptsChange([
        ...selectedPrompts,
        { promptId: prompt.id, prompt: prompt.text, answer: '' },
      ]);
      setExpandedPromptId(prompt.id);
    }
  };

  const handleAnswerChange = (promptId: string, answer: string) => {
    onPromptsChange(
      selectedPrompts.map((p) =>
        p.promptId === promptId ? { ...p, answer } : p
      )
    );
  };

  const handlePracticalAnswer = (questionId: string, answer: string) => {
    onPracticalAnswersChange({
      ...practicalAnswers,
      [questionId]: answer,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Fun Prompts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Add Some Personality</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Pick {MIN_PROMPTS_REQUIRED} prompts to show on your profile ({selectedPrompts.length}/{MIN_PROMPTS_REQUIRED} selected)
        </Text>

        <View style={styles.promptsList}>
          {FUN_PROMPTS.map((prompt) => {
            const isSelected = isPromptSelected(prompt.id);
            const isExpanded = expandedPromptId === prompt.id;
            const answer = getPromptAnswer(prompt.id);

            return (
              <View key={prompt.id}>
                <TouchableOpacity
                  style={[
                    styles.promptCard,
                    isSelected && styles.promptCardSelected,
                    !isSelected && selectedPrompts.length >= MIN_PROMPTS_REQUIRED && styles.promptCardDisabled,
                  ]}
                  onPress={() => handlePromptSelect(prompt)}
                  disabled={!isSelected && selectedPrompts.length >= MIN_PROMPTS_REQUIRED}
                >
                  <View style={styles.promptContent}>
                    <Text style={[
                      styles.promptText,
                      isSelected && styles.promptTextSelected,
                    ]}>
                      {prompt.text}
                    </Text>
                    {isSelected && (
                      <TouchableOpacity
                        onPress={() => setExpandedPromptId(isExpanded ? null : prompt.id)}
                      >
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {!isSelected && selectedPrompts.length < MIN_PROMPTS_REQUIRED && (
                    <View style={styles.addIcon}>
                      <Ionicons name="add-circle-outline" size={24} color={colors.gray[400]} />
                    </View>
                  )}
                  {isSelected && !isExpanded && answer && (
                    <Text style={styles.answerPreview} numberOfLines={1}>
                      "{answer}"
                    </Text>
                  )}
                </TouchableOpacity>

                {isSelected && isExpanded && (
                  <View style={styles.answerContainer}>
                    <TextInput
                      style={styles.answerInput}
                      placeholder={prompt.placeholder}
                      placeholderTextColor={colors.gray[400]}
                      value={answer}
                      onChangeText={(text) => handleAnswerChange(prompt.id, text)}
                      multiline
                      maxLength={150}
                    />
                    <Text style={styles.charCount}>{answer.length}/150</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Practical Questions Section */}
      {practicalQuestions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="clipboard" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Quick Info</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Help others know more about you
          </Text>

          <View style={styles.practicalList}>
            {practicalQuestions.map((question) => (
              <View key={question.id} style={styles.practicalCard}>
                <Text style={styles.practicalQuestion}>{question.question}</Text>
                <View style={styles.optionsRow}>
                  {question.options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionChip,
                        practicalAnswers[question.id] === option && styles.optionChipSelected,
                      ]}
                      onPress={() => handlePracticalAnswer(question.id, option)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          practicalAnswers[question.id] === option && styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 16,
    marginLeft: 28,
  },
  promptsList: {
    gap: 12,
  },
  promptCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray[100],
  },
  promptCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  promptCardDisabled: {
    opacity: 0.5,
  },
  promptContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptText: {
    fontSize: 15,
    color: colors.gray[700],
    flex: 1,
    marginRight: 8,
  },
  promptTextSelected: {
    color: colors.gray[900],
    fontWeight: '600',
  },
  addIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  answerPreview: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  answerContainer: {
    backgroundColor: colors.white,
    marginTop: -8,
    marginHorizontal: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: colors.primary,
    padding: 16,
    paddingTop: 12,
  },
  answerInput: {
    fontSize: 15,
    color: colors.gray[900],
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },
  practicalList: {
    gap: 16,
  },
  practicalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  practicalQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.white,
  },
  bottomPadding: {
    height: 40,
  },
});
