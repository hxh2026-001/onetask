import { createSignal, createEffect, For } from 'solid-js';
import { 
  triggerResultReveal, 
  triggerNaNRender, 
  triggerOverflowVisual,
  triggerInfiniteLoopVisual,
  triggerErrorFlash,
  triggerGlitchEffect,
  animateNumber
} from '../utils/animations.js';

export default function ResultDisplay(props) {
  const [displayResultNum, setDisplayResultNum] = createSignal(0);
  const [displayResultDen, setDisplayResultDen] = createSignal(1);
  const [showSteps, setShowSteps] = createSignal([]);

  const formatImproper = (result) => {
    if (!result || result.denominator <= 0) return '';
    const whole = Math.floor(result.numerator / result.denominator);
    const remainder = result.numerator % result.denominator;
    if (remainder === 0) return String(whole);
    return `${whole} 又 ${remainder}/${result.denominator}`;
  };

  createEffect(() => {
    if (props.result && props.result.isNaN) {
      setTimeout(() => {
        triggerNaNRender('result-numerator');
        triggerNaNRender('result-denominator');
      }, 400);
    } else if (props.result && props.result.numerator !== undefined) {
      animateNumber(0, props.result.numerator, 800, (v) => setDisplayResultNum(v));
      animateNumber(0, props.result.denominator, 800, (v) => setDisplayResultDen(v));
    }
  });

  createEffect(() => {
    if (props.steps && props.steps.length > 0) {
      setShowSteps([]);
      props.steps.forEach((step, index) => {
        setTimeout(() => {
          setShowSteps(prev => [...prev, step]);
        }, index * 400);
      });
    }
  });

  createEffect(() => {
    if (props.errorState?.type === 'overflow') {
      setTimeout(() => {
        triggerOverflowVisual('result-numerator', '9999999999999999');
      }, 300);
    }
  });

  createEffect(() => {
    if (props.errorState?.type === 'infinite_loop') {
      setTimeout(() => {
        triggerInfiniteLoopVisual('result-numerator', 25);
      }, 300);
    }
  });

  createEffect(() => {
    if (props.result || props.errorState?.type) {
      setTimeout(() => {
        triggerResultReveal('result-fraction-container', 200);
      }, 100);
    }
  });

  const getStepDelay = (index) => ({
    'animation-delay': `${index * 0.1}s`
  });

  const isError = props.errorState?.type === 'error' || props.errorState?.type === 'nan' || 
                  props.errorState?.type === 'overflow' || props.errorState?.type === 'infinite_loop';

  return (
    <div 
      id="result-display"
      class={`result-section ${props.result || props.errorState?.type ? 'show' : ''} ${isError ? 'error' : ''}`}
      data-text={isError ? 'ERROR' : ''}
    >
      <div class="result-title">
      {props.errorState?.type === 'improper' && (
        <span class="status-indicator warning" style={{ marginRight: '8px' }}>
          <span class="status-dot"></span>
          ⚠️ 假分数
        </span>
      )}
      {isError && (
        <span class="status-indicator error" style={{ marginRight: '8px' }}>
          <span class="status-dot"></span>
          ❌ 运算错误
        </span>
      )}
      {!isError && props.result && (
        <span class="status-indicator success" style={{ marginRight: '8px' }}>
          <span class="status-dot"></span>
          ✅ 运算成功
        </span>
      )}
      {props.errorState?.message || (props.result ? '计算结果' : '等待计算...')}
    </div>

    {props.errorState?.type && !props.result ? (
      <div style={{ 
        padding: '16px', 
        background: '#fef2f2', 
        borderRadius: '8px', 
        color: '#991b1b',
        marginTop: '12px',
        fontWeight: '600'
      }}>
        {props.errorState.message}
      </div>
    ) : null}

    <div id="result-fraction-container">
      {props.result && (
        <div class="result-fraction" id="result-fraction">
          <div style={{ fontSize: '1.5rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{props.fraction1.numerator}/{props.fraction1.denominator}</span>
            <span style={{ color: '#4f46e5', fontWeight: '700' }}>{props.operator}</span>
            <span>{props.fraction2.numerator}/{props.fraction2.denominator}</span>
          </div>
          <span class="equals">=</span>
          <div class="fraction-display" style={{ fontSize: '2.5rem' }}>
            <span class="numerator" id="result-numerator">
              {props.result.isNaN ? (
                <span class="nan-text">NaN</span>
              ) : (
                <span class="number-bounce">{displayResultNum()}</span>
              )}
            </span>
            <span class="denominator" id="result-denominator">
              {props.result.isNaN ? (
                <span class="nan-text">NaN</span>
              ) : (
                <span class="number-bounce">{displayResultDen()}</span>
              )}
            </span>
          </div>
          {props.result.simplified === false && !props.result.isNaN && (
            <span class="status-indicator error" style={{ marginLeft: '12px' }}>
              ⚠️ 未化简
            </span>
          )}
          {props.result.simplified && !props.result.isNaN && props.result.numerator >= props.result.denominator && (
            <span class="improper-badge">假分数</span>
          )}
        </div>
      )}
    </div>

    {showSteps().length > 0 && (
      <div>
        <div style={{ fontWeight: '700', marginBottom: '12px', color: '#475569' }}>
          📝 运算步骤:
        </div>
        <div class="steps-container">
          <For each={showSteps()}>
            {(step, index) => (
              <div 
                class={`step-item ${step.type === 'error' || step.type === 'overflow' ? 'error' : ''}`}
                style={getStepDelay(index())}
              >
                <strong>{step.description}</strong>
                {step.data && (
                  <div style={{ marginTop: '4px', fontSize: '0.85rem', opacity: 0.8 }}>
                    {step.data.num1 !== undefined && (
                      <span>
                      {step.data.num1}/{step.data.den1} {step.data.operator || ''} {step.data.num2}/{step.data.den2}
                      </span>
                    )}
                    {step.data.commonDen !== undefined && (
                      <span>公分母: {step.data.commonDen}</span>
                    )}
                    {step.data.resultNum !== undefined && !step.data.error && (
                      <span>
                      结果: {step.data.resultNum}/{step.data.resultDen}
                      </span>
                    )}
                    {step.data.error && (
                      <span style={{ color: '#dc2626' }}>
                      错误: {step.data.error}</span>
                    )}
                    {step.data.numerator !== undefined && step.data.simplified && (
                      <span>
                      化简后: {step.data.numerator}/{step.data.denominator}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </For>
        </div>
      </div>
    )}

    {props.errorState?.type === 'nan' && (
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#1a1a2e', 
        borderRadius: '8px', 
        color: '#ef4444',
        fontSize: '0.9rem'
      }}>
        <strong>💡 知识点：</strong>
        <p style={{ marginTop: '8px' }}>
          在数学中，分数的分母不能为零。当分母为零时，这个分数是没有意义的，
          因为任何数除以零都是未定义的。在 JavaScript 中会显示 <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '4px' }}>NaN</code>（Not a Number）。
        </p>
      </div>
    )}

    {props.errorState?.type === 'overflow' && (
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#7f1d1d', 
        borderRadius: '8px', 
        color: '#fef2f2',
        fontSize: '0.9rem'
      }}>
        <strong>💡 知识点：</strong>
        <p style={{ marginTop: '8px' }}>
          当数字太大时，会发生「数值溢出」。JavaScript 的安全整数范围是 ±2⁵³-1，
          当计算结果超出这个范围时，精度会丢失。这就是为什么通分时要注意分母不能太大的原因！
        </p>
      </div>
    )}

    {props.errorState?.type === 'infinite_loop' && (
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#78350f', 
        borderRadius: '8px', 
        color: '#fef3c7',
        fontSize: '0.9rem'
      }}>
        <strong>💡 知识点：</strong>
        <p style={{ marginTop: '8px' }}>
          在求最大公约数（GCD）时，如果不注意边界条件，可能会导致「无限递归」或「死循环」。
          这就是为什么我们需要在递归算法中添加深度限制的原因！
        </p>
      </div>
    )}

    {props.errorState?.type === 'improper' && (
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#fef3c7', 
        borderRadius: '8px', 
        color: '#92400e',
        fontSize: '0.9rem'
      }}>
        <strong>💡 知识点：</strong>
        <p style={{ marginTop: '8px' }}>
          当分子大于或等于分母的分数叫做「假分数」。假分数可以化简为「带分数」或整数。
          例如：{props.result?.numerator}/{props.result?.denominator} = {formatImproper(props.result)}
        </p>
      </div>
    )}
  </div>
  );
}
