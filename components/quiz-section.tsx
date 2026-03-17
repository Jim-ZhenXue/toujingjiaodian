"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, HelpCircle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuizSectionProps {
  measuredDistance: number
  actualFocalLength: number
  onReset: () => void
}

const options = [
  { id: "A", text: "一定小于 L", value: "less" },
  { id: "B", text: "一定大于 L", value: "greater" },
  { id: "C", text: "可能等于 L", value: "equal" },
  { id: "D", text: "可能小于 L，也可能大于 L", value: "both" },
]

export function QuizSection({ measuredDistance, actualFocalLength, onReset }: QuizSectionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const correctAnswer = "D"
  const isCorrect = selectedAnswer === correctAnswer

  const handleSubmit = () => {
    if (selectedAnswer) {
      setShowResult(true)
    }
  }

  const handleReset = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    setShowExplanation(false)
    onReset()
  }

  return (
    <div className="space-y-6">
      {/* 题目 */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">问题</h3>
            <p className="text-muted-foreground leading-relaxed">
              小明同学利用太阳光测量凸透镜的焦距，方法如图所示。他注意到让凸透镜正对阳光，
              但没有仔细调节纸片与透镜的距离，在纸片上的光斑并不是最小时，
              就测出了光斑到凸透镜中心的距离 <span className="font-bold text-primary">L = {Math.round(measuredDistance)}</span>，
              那么，凸透镜的实际焦距（  ）
            </p>
          </div>
        </div>

        {/* 选项 */}
        <div className="grid gap-3 mt-6">
          {options.map((option) => {
            const isSelected = selectedAnswer === option.id
            const isCorrectOption = option.id === correctAnswer
            
            let optionClass = "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
            if (showResult) {
              if (isCorrectOption) {
                optionClass = "border-green-500 bg-green-50"
              } else if (isSelected && !isCorrectOption) {
                optionClass = "border-destructive bg-red-50"
              }
            } else if (isSelected) {
              optionClass = "border-primary bg-primary/10"
            }

            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: showResult ? 1 : 1.01 }}
                whileTap={{ scale: showResult ? 1 : 0.99 }}
                onClick={() => !showResult && setSelectedAnswer(option.id)}
                disabled={showResult}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${optionClass}
                  ${showResult ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                  ${showResult && isCorrectOption 
                    ? 'bg-green-500 text-white' 
                    : showResult && isSelected && !isCorrectOption
                    ? 'bg-destructive text-white'
                    : isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}
                `}>
                  {showResult && isCorrectOption ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : showResult && isSelected && !isCorrectOption ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    option.id
                  )}
                </div>
                <span className={`font-medium ${showResult && isCorrectOption ? 'text-green-700' : 'text-foreground'}`}>
                  {option.text}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* 提交按钮 */}
      {!showResult && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="w-full h-12 text-lg font-medium"
        >
          提交答案
        </Button>
      )}

      {/* 结果展示 */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-2xl p-6 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div>
                    <h4 className="text-xl font-bold text-green-700">回答正确！</h4>
                    <p className="text-green-600">你真棒！完全理解了这个概念。</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-destructive" />
                  <div>
                    <h4 className="text-xl font-bold text-red-700">回答错误</h4>
                    <p className="text-red-600">正确答案是 D。让我们来看看为什么。</p>
                  </div>
                </>
              )}
            </div>

            {/* 解释按钮 */}
            <Button
              variant="outline"
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full mt-4"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {showExplanation ? "收起解析" : "查看解析"}
            </Button>

            {/* 详细解释 */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-card rounded-xl border border-border"
                >
                  <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    解析
                  </h5>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">关键点：</strong>只有当光斑最小时，纸片才恰好位于焦点处。
                    </p>
                    <p>
                      <strong className="text-foreground">分析：</strong>题目明确指出"在纸片上的光斑并不是最小"，
                      这意味着纸片不在焦点位置。
                    </p>
                    <div className="bg-primary/5 p-3 rounded-lg">
                      <p className="font-medium text-foreground mb-2">两种情况：</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>纸片在焦点<strong>前面</strong>（距透镜更近）→ L &lt; f</li>
                        <li>纸片在焦点<strong>后面</strong>（距透镜更远）→ L &gt; f</li>
                      </ul>
                    </div>
                    <p>
                      <strong className="text-foreground">结论：</strong>由于无法确定纸片在焦点前还是后，
                      实际焦距可能小于 L，也可能大于 L。
                    </p>
                    <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                      <p className="font-medium text-accent-foreground">
                        本题中：实际焦距 f = {actualFocalLength}，你测量的 L = {Math.round(measuredDistance)}，
                        {actualFocalLength < measuredDistance 
                          ? ` f < L，纸片在焦点后面。`
                          : actualFocalLength > measuredDistance
                          ? ` f > L，纸片在焦点前面。`
                          : ` f = L，正好在焦点上。`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 重新开始 */}
      {showResult && (
        <Button
          variant="secondary"
          onClick={handleReset}
          className="w-full"
        >
          重新开始实验
        </Button>
      )}
    </div>
  )
}
