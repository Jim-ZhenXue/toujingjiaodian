"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, BookOpen, Play, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LensSimulation } from "@/components/lens-simulation"
import { QuizSection } from "@/components/quiz-section"

type GamePhase = "intro" | "experiment" | "quiz"

export default function ConvexLensGame() {
  const [phase, setPhase] = useState<GamePhase>("intro")
  const [measuredDistance, setMeasuredDistance] = useState(150)
  const [actualFocalLength] = useState(120) // 实际焦距，学生不可见

  const handleDistanceChange = useCallback((distance: number) => {
    setMeasuredDistance(distance)
  }, [])

  const handleStartExperiment = () => {
    setPhase("experiment")
  }

  const handleCompleteExperiment = () => {
    setPhase("quiz")
  }

  const handleReset = () => {
    setPhase("intro")
    setMeasuredDistance(150)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* 头部 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl">
              <Sun className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">凸透镜焦距实验</h1>
              <p className="text-xs text-muted-foreground">物理光学互动学习</p>
            </div>
          </div>
          {phase !== "intro" && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
          )}
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {/* 介绍页面 */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* 标题卡片 */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-3xl p-8 border border-border">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium text-accent-foreground bg-accent/20 px-3 py-1 rounded-full">
                      互动物理实验
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                    用太阳光测量凸透镜焦距
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                    通过亲自动手实验，理解为什么测量时必须找到最小光斑才能准确测出焦距。
                  </p>
                </div>
              </div>

              {/* 学习目标 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">学习目标</h3>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      理解凸透镜对平行光的会聚作用
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      明白焦点与最小光斑的关系
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      分析测量误差的来源
                    </li>
                  </ul>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-accent/20 p-3 rounded-xl">
                      <Sun className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">实验原理</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    太阳光可以近似看作平行光。当平行光通过凸透镜后，
                    会会聚到一点——这就是<strong className="text-foreground">焦点</strong>。
                    焦点到透镜中心的距离就是<strong className="text-foreground">焦距</strong>。
                  </p>
                </div>
              </div>

              {/* 开始按钮 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleStartExperiment}
                  size="lg"
                  className="w-full h-14 text-lg font-medium rounded-2xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  开始实验
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* 实验页面 */}
          {phase === "experiment" && (
            <motion.div
              key="experiment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:items-start">
                {/* 左侧文字区 */}
                <div className="space-y-4 lg:sticky lg:top-24">
                  {/* 实验指导 */}
                  <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/20 p-2 rounded-lg shrink-0">
                        <Sparkles className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">实验任务</h3>
                        <p className="text-sm text-muted-foreground">
                          拖动右侧的纸片，观察光斑大小的变化。尝试找到最小光斑的位置，
                          然后故意偏离这个位置，记录此时的距离 L，点击"开始答题"。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 提示卡片 */}
                  <div className="bg-card rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-foreground">提示：</strong>
                          当纸片在焦点位置时，光斑最小最亮。偏离焦点后，光斑会变大变暗。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 开始答题按钮 */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleCompleteExperiment}
                      size="lg"
                      className="w-full h-12 text-lg font-medium"
                    >
                      开始答题
                    </Button>
                  </motion.div>
                </div>

                {/* 右侧模拟器区（尽量占空间） */}
                <div className="min-w-0">
                  <LensSimulation
                    focalLength={actualFocalLength}
                    onDistanceChange={handleDistanceChange}
                    onComplete={handleCompleteExperiment}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 答题页面 */}
          {phase === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <QuizSection
                measuredDistance={measuredDistance}
                actualFocalLength={actualFocalLength}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 页脚 */}
      <footer className="border-t border-border mt-12">
        <div className="w-full px-4 sm:px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            初中物理 · 光学 · 凸透镜成像规律
          </p>
        </div>
      </footer>
    </main>
  )
}
