<template>
  <div 
    class="validation-panel"
    :class="{ 'error-pulse': hasErrors }"
  >
    <h3 class="panel-title">规则校验</h3>
    
    <div v-if="validationResult" class="validation-result">
      <div 
        class="validation-status"
        :class="validationResult.valid ? 'valid' : 'invalid'"
      >
        <div class="status-icon">
          <svg v-if="validationResult.valid" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
            <path d="M7 12 L10 15 L17 8" stroke="white" stroke-width="2" fill="none"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#f44336"/>
            <path d="M7 7 L17 17 M17 7 L7 17" stroke="white" stroke-width="2" fill="none"/>
          </svg>
        </div>
        <div class="status-text">
          {{ validationResult.valid ? '纹章合规' : '存在违规' }}
        </div>
      </div>

      <div v-if="validationResult.errors.length > 0" class="error-list">
        <h4 class="error-title">违规项</h4>
        <div 
          v-for="(error, index) in validationResult.errors" 
          :key="index"
          class="error-item"
          :class="error.severity"
        >
          <div class="error-icon">
            {{ error.severity === 'error' ? '✕' : '⚠' }}
          </div>
          <div class="error-content">
            <div class="error-rule">{{ error.ruleName }}</div>
            <div class="error-message">{{ error.message }}</div>
            <div v-if="error.layerId !== undefined" class="error-layer">
              关联图层 ID: {{ error.layerId }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="validationResult.valid" class="success-info">
        <p>✓ 色彩对比律通过</p>
        <p>✓ 继承规则符合</p>
        <p>✓ 分区结构合规</p>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>点击"校验规则"按钮</p>
      <p class="hint">检查纹章是否符合纹章学规范</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ValidationResult } from '~/server/utils/heraldryRules'

interface Props {
  validationResult: ValidationResult | null
}

const props = defineProps<Props>()

const hasErrors = computed(() => {
  return props.validationResult && !props.validationResult.valid
})
</script>

<style scoped>
.validation-panel {
  background: rgba(26, 26, 46, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #3a3a5a;
  transition: all 0.3s ease;
}

.validation-panel.error-pulse {
  border-color: #f44336;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3a3a5a;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.validation-status.valid {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.validation-status.invalid {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.status-icon {
  flex-shrink: 0;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
  color: #e8e8e8;
}

.validation-status.valid .status-text {
  color: #4CAF50;
}

.validation-status.invalid .status-text {
  color: #f44336;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-title {
  font-size: 14px;
  font-weight: 600;
  color: #ff6666;
  margin-bottom: 8px;
}

.error-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(244, 67, 54, 0.05);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 8px;
}

.error-item.warning {
  background: rgba(255, 152, 0, 0.05);
  border-color: rgba(255, 152, 0, 0.2);
}

.error-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f44336;
  color: white;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-item.warning .error-icon {
  background: #FF9800;
}

.error-content {
  flex: 1;
  min-width: 0;
}

.error-rule {
  font-size: 14px;
  font-weight: 600;
  color: #ff8888;
  margin-bottom: 4px;
}

.error-item.warning .error-rule {
  color: #FFB74D;
}

.error-message {
  font-size: 13px;
  color: #ccccee;
  line-height: 1.4;
}

.error-layer {
  font-size: 11px;
  color: #8a8aaa;
  margin-top: 4px;
}

.success-info {
  padding: 16px;
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
}

.success-info p {
  color: #81C784;
  font-size: 14px;
  margin: 8px 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6a6a8a;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state .hint {
  font-size: 12px;
  color: #5a5a7a;
}
</style>
