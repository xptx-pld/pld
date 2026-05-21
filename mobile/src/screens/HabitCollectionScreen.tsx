import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'

type Props = {
  navigation: NativeStackNavigationProp<any>
}

const SLEEP_OPTIONS = ['22:00前', '22:00-23:00', '23:00-00:00', '00:00后']
const WAKE_OPTIONS = ['6:00前', '6:00-7:00', '7:00-8:00', '8:00后']
const CLEANLINESS_OPTIONS = ['每天打扫', '每周2-3次', '每周1次', '看心情']
const TEMP_OPTIONS = ['怕冷', '适中', '怕热']
const NOISE_OPTIONS = ['非常敏感', '比较敏感', '一般', '不太敏感']
const PERSONALITY_OPTIONS = ['内向', '外向', '看情况']
const LIGHT_OPTIONS = ['喜欢明亮', '喜欢昏暗', '自然光']
const SOCIAL_OPTIONS = ['很少', '偶尔', '经常']
const STUDY_OPTIONS = ['寝室', '图书馆', '自习室', '都可以']

interface HabitData {
  sleepTime: string
  wakeTime: string
  napHabit: boolean
  stayUpLate: boolean
  cleanliness: string
  cleanLevel: number
  tempPreference: string
  windowVentilation: boolean
  lightPreference: string
  noiseSensitivity: string
  useHeadphones: boolean
  gameVideoSound: boolean
  personality: string
  bringFriends: string
  smoking: boolean
  snoring: boolean
  studyLocation: string
  specialSchedule: string
  quietStudy: boolean
}

export default function HabitCollectionScreen({ navigation }: Props) {
  const { completeHabitCollection } = useAuthStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<HabitData>({
    sleepTime: '',
    wakeTime: '',
    napHabit: false,
    stayUpLate: false,
    cleanliness: '',
    cleanLevel: 3,
    tempPreference: '',
    windowVentilation: false,
    lightPreference: '',
    noiseSensitivity: '',
    useHeadphones: false,
    gameVideoSound: false,
    personality: '',
    bringFriends: '',
    smoking: false,
    snoring: false,
    studyLocation: '',
    specialSchedule: '',
    quietStudy: false,
  })

  const updateData = (key: keyof HabitData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    // TODO: 保存到后端
    console.log('习惯数据:', data)
    await completeHabitCollection()
    Alert.alert('完成', '习惯收集完成！', [
      {
        text: '确定',
        onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        }),
      },
    ])
  }

  const renderOptionButtons = (
    options: string[],
    selected: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            selected === option && styles.optionButtonSelected,
          ]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.optionText,
              selected === option && styles.optionTextSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const renderYesNo = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <View style={styles.yesNoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.yesNoButtons}>
        <TouchableOpacity
          style={[styles.yesNoButton, value && styles.yesNoButtonSelected]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.yesNoText, value && styles.yesNoTextSelected]}>是</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.yesNoButton, !value && styles.yesNoButtonSelected]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.yesNoText, !value && styles.yesNoTextSelected]}>否</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>作息习惯</Text>
            <Text style={styles.label}>通常几点睡觉？</Text>
            {renderOptionButtons(SLEEP_OPTIONS, data.sleepTime, (v) => updateData('sleepTime', v))}

            <Text style={styles.label}>通常几点起床？</Text>
            {renderOptionButtons(WAKE_OPTIONS, data.wakeTime, (v) => updateData('wakeTime', v))}

            {renderYesNo('有午休习惯吗？', data.napHabit, (v) => updateData('napHabit', v))}
            {renderYesNo('经常熬夜吗？', data.stayUpLate, (v) => updateData('stayUpLate', v))}
          </View>
        )

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>卫生习惯</Text>
            <Text style={styles.label}>打扫频率</Text>
            {renderOptionButtons(CLEANLINESS_OPTIONS, data.cleanliness, (v) => updateData('cleanliness', v))}

            <Text style={styles.label}>对整洁度要求（1-5）</Text>
            <View style={styles.optionsContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    data.cleanLevel === level && styles.levelButtonSelected,
                  ]}
                  onPress={() => updateData('cleanLevel', level)}
                >
                  <Text
                    style={[
                      styles.levelText,
                      data.cleanLevel === level && styles.levelTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.levelHint}>1=随意 3=一般 5=非常整洁</Text>
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>环境偏好</Text>
            <Text style={styles.label}>温度偏好</Text>
            {renderOptionButtons(TEMP_OPTIONS, data.tempPreference, (v) => updateData('tempPreference', v))}

            {renderYesNo('喜欢开窗通风吗？', data.windowVentilation, (v) => updateData('windowVentilation', v))}

            <Text style={styles.label}>照明偏好</Text>
            {renderOptionButtons(LIGHT_OPTIONS, data.lightPreference, (v) => updateData('lightPreference', v))}
          </View>
        )

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>噪音相关</Text>
            <Text style={styles.label}>噪音敏感度</Text>
            {renderOptionButtons(NOISE_OPTIONS, data.noiseSensitivity, (v) => updateData('noiseSensitivity', v))}

            {renderYesNo('经常戴耳机吗？', data.useHeadphones, (v) => updateData('useHeadphones', v))}
            {renderYesNo('游戏/视频外放吗？', data.gameVideoSound, (v) => updateData('gameVideoSound', v))}
          </View>
        )

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>社交与生活</Text>
            <Text style={styles.label}>性格</Text>
            {renderOptionButtons(PERSONALITY_OPTIONS, data.personality, (v) => updateData('personality', v))}

            <Text style={styles.label}>带朋友回寝室频率</Text>
            {renderOptionButtons(SOCIAL_OPTIONS, data.bringFriends, (v) => updateData('bringFriends', v))}

            {renderYesNo('是否抽烟？', data.smoking, (v) => updateData('smoking', v))}
            {renderYesNo('是否打呼噜？', data.snoring, (v) => updateData('snoring', v))}

            <Text style={styles.label}>学习地点偏好</Text>
            {renderOptionButtons(STUDY_OPTIONS, data.studyLocation, (v) => updateData('studyLocation', v))}
          </View>
        )

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>特殊需求</Text>
            <Text style={styles.label}>其他作息说明（可选）</Text>
            <TextInput
              style={styles.textInput}
              placeholder="如：需要早起晨跑、深夜学习等"
              placeholderTextColor="#999"
              value={data.specialSchedule}
              onChangeText={(v) => updateData('specialSchedule', v)}
              multiline
            />

            {renderYesNo('需要安静环境备考吗？', data.quietStudy, (v) => updateData('quietStudy', v))}
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>个人习惯收集</Text>
        <Text style={styles.headerSubtitle}>帮助我们匹配最适合你的室友</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 6) * 100}%` }]} />
        </View>
        <Text style={styles.stepIndicator}>{step + 1} / 6</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>上一步</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, step === 5 && styles.submitButton]}
          onPress={() => {
            if (step < 5) {
              setStep(step + 1)
            } else {
              handleSubmit()
            }
          }}
        >
          <Text style={styles.nextButtonText}>
            {step === 5 ? '完成' : '下一步'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    marginTop: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    color: '#666',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
  },
  levelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  levelButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  levelText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  levelTextSelected: {
    color: '#fff',
  },
  levelHint: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  yesNoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  yesNoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  yesNoButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  yesNoButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  yesNoText: {
    color: '#666',
    fontSize: 14,
  },
  yesNoTextSelected: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
