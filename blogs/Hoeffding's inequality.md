---
title: Hoeffding's inequality
date: 2026-09-06
summary: 记录一下概率论中霍夫丁不等式的学习。
tags: [随笔]
draft: false
# 外链封面：不影响仓库体积，但图挂了会回退成渐变占位（见 src/posts.ts 的 resolveCover）
cover: https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1600&h=900&fit=crop
---

**霍夫丁不等式（Hoeffding's inequality）是机器学习的基础理论，通过它可以推导出机器学习在理论上的可行性。**

## 马尔可夫不等式 *Markov’s inequality*

​	**定理：** 若 $X$ 是一个非负随机变量且 $a>0$ ，那么 $X$ 至少为 $a$ 的概率最多是 $X$ 的期望值 $E(X)$ 除以 $a$， 即：
$$P(X \ge a) \le \frac{E(X)}{a}$$
​	**证明**：易知
$$E(X)=\int_{-\infty}^{\infty}xf(x)dx=\int_{0}^{\infty}xf(x)dx=\int_{0}^{a}xf(x)dx+\int_{a}^{\infty}xf(x)dx$$
​	易证	$\int_a^{\infty}xf(x)dx \ge \int_a^{\infty}af(x)dx$

​	故：
$$E(X) \ge \int_{a}^{\infty}xf(x)dx \ge \int_a^{\infty}af(x)dx = a\int_a^{\infty}f(x)dx=aP(X \ge a)$$
​	取等条件：当且仅当
$P(x=a)=\frac{E(x)}{a}，\ \ P(x=0)=1-\frac{E(x)}{a}$
​	证毕.

​	

## 切比雪夫不等式 Chebyshev’s inequality

​	**定理：** 对任意随机变量 $X$ 与实数 $\varepsilon \gt 0$，均有
$$P(|X-E(X)| \ge \varepsilon) \le \frac{D(X)}{\varepsilon^2}$$

​		其中 $E(X)$ 为变量 $X$ 的均值， $D(X)$为方差

​	**证明：**

​		由霍夫丁不等式，
$$P(|X-E(X)|^2 \ge \varepsilon^2) \le \frac{E(|X-E(X)|^2)}{\varepsilon^2}=\frac{D(X)}{\varepsilon^2}$$
​		而：
$$P(|X-E(X)| \ge \varepsilon) = P(|X-E(X)|^2 \ge \varepsilon^2)$$
​		故得证

## 大数定理

可以由切比雪夫不等式直接推得大数定理

​	**定理：** 设随机变量 $X_1,X_2,...,X_n,...$ 互相独立，并且具有相同的期望 $μ$ 和方差 $σ^2$ .对于前$n$个随机变量的平均 $Y_n=\frac{1}{n}∑_{i=1}^nX_i $,则有任意正数 $ε$ ,有：
$$\lim_{n→∞⁡}P\{|Y_n−μ|<ε\}=1$$
​	**证明：**
$$E(Y_n)=E(\frac{1}{n} \sum_{i=1}^n X_i)=\frac{1}{n}E( \sum_{i=1}^n X_i)=\frac{1}{n}(n\mu)=\mu$$
​	又由独立性可知，
$$D(Y_n)=D(\frac{1}{n} \sum_{i=1}^n X_i)=\frac{1}{n^2}D(\sum_{i=1}^n X_i)=\frac{1}{n^2}(n\sigma^2)=\frac{\sigma^2}{n}$$
​	由切比雪夫不等式，
$$1 \ge P\{|Y_n-\mu|<\varepsilon\} \ge 1-\frac{D(Y_n)}{\varepsilon^2}=1-\frac{\sigma^2}{n\varepsilon^2}$$
​	令 $n \rightarrow \infty$，就可证明结论.

大数定理说明当 $n$很大时，随机变量 $X_1,X_2,...,X_n,... $的平均值 $Y_n$ 在概率意义下无限接近于期望 $μ$ .

而对于统计学习中一个重要概念——**[PAC](https://zhida.zhihu.com/search?content_id=111872767&content_type=Article&match_order=1&q=PAC&zhida_source=entity):** 对于非常大的N时，有 $E_{in}(h)=E_{out}(h) $**几乎相对正确**(probably approxiamtely correct. PAC) :
$$\mathbb{P}[|E_{in}(h)−E_{out}(h)|>ϵ]≤2 e^{−2ϵ^2N}$$

## 霍夫丁引理Hoeffding's lemma

​	**定理：** 假设随机有界变量 $Z \in [a,b]$，有
$$E[exp(\lambda(Z-E(Z)))] \le \exp(\frac{\lambda^2(b-a)^2}{8}) \ \ \ \ for\ all \ \lambda \in R$$
​	**证明：** 令 $Z'$ 为一个和 $Z$ 拥有相同分布的独立复制变量，于是： $Z’∈[a,b]， E[Z']=E[Z]$.

​	现在可以由**Jensen不等式**我们可以得到如下不等式：
$$E[exp(\lambda(Z-E_Z[Z]))] = E[exp(\lambda(Z-E_{Z'}[Z']))] \le E_Z[E_{Z'}exp(\lambda(Z-Z'))]$$
​	不等式中的该步骤是对函数 $f(x)=e^{−x}$ 使用Jensen不等式的结果，即有：
$$f[E[Z]] \le E[f(Z)] \ \ \ => \ \ E[\exp(\lambda(Z-E_{Z'}[Z']))] \le E[\exp(\lambda(Z-Z'))]$$
​	根据对称性，引入独立等概率取 $\pm 1$ 的 Rademacher 随机变量 $S$（即 $P(S=1)=P(S=-1)=\frac{1}{2}$），且 $S$ 与 $Z, Z'$ 独立：
$$E_{Z,Z'}[\exp(\lambda(Z-Z'))] = E_{Z,Z'}\left[ E_S [\exp(\lambda S (Z-Z'))] \right]$$
由于 $S$ 取值特例，对内部求期望：
$$E_S [\exp(\lambda S(Z-Z'))] = \frac{1}{2}\exp(\lambda(Z-Z')) + \frac{1}{2}\exp(-\lambda(Z-Z')) = \cosh(\lambda(Z-Z'))$$
利用泰勒级数展开可知：对于任意实数 $x$，有 $\cosh(x) \le \exp\left(\frac{x^2}{2}\right)$。因为 $Z, Z' \in [a, b]$，所以 $\vert{}Z-Z'\vert{} \le b-a$, 带入上式：
$$\cosh(\lambda(Z-Z')) \le \exp\left(\frac{\lambda^2(Z-Z')^2}{2}\right) \le \exp\left(\frac{\lambda^2(b-a)^2}{2}\right)$$
但这并不是最紧的界。更精细地利用凸函数性质（Taylor 展式与 Rademacher 变量绑定法），可直接利用 Jensen 不等式与二次上界（或者使用对数矩母函数的二阶导数上界）：

令 $X = Z - E[Z]$，则 $E[X] = 0$ 且 $X \in [a - E[Z], b - E[Z]]$。设 $u = a - E[Z], v = b - E[Z]$，则 $X \in [u, v]$ 且 $E[X]=0$。由指数函数 $e^{\lambda x}$ 的凸性，对于 $x \in [u, v]$，可将其写成端点的凸组合：

$$x = \frac{v-x}{v-u}u + \frac{x-u}{v-u}v$$

利用割线割线性质（凸性）：$$e^{\lambda x} \le \frac{v-x}{v-u}e^{\lambda u} + \frac{x-u}{v-u}e^{\lambda v}$$

两边对 $X$ 取期望（注意 $E[X]=0$）：$$E[e^{\lambda X}] \le \frac{v}{v-u}e^{\lambda u} - \frac{u}{v-u}e^{\lambda v} = e^{g(p)}$$

其中 $p = \frac{-u}{v-u}$（注意到 $0 \le p \le 1$），$g(p) = -\theta p + \ln(1 - p + p e^\theta)$，且 $\theta = \lambda(v-u) = \lambda(b-a)$。对 $g(\theta)$ 在 $\theta=0$ 处进行 Taylor 展开，易证其二阶导数满足 $g''(\theta) \le \frac{1}{4}$。由拉格朗日余项定理：
$$g(\theta) \le g(0) + g'(0)\theta + \frac{1}{2} \max g''(\theta) \theta^2 \le 0 + 0 + \frac{1}{8}\theta^2 = \frac{\lambda^2(b-a)^2}{8}$$
代回原式即可得证：$$E[\exp(\lambda(Z-E[Z]))] \le \exp\left(\frac{\lambda^2(b-a)^2}{8}\right)$$证毕.

## 霍夫丁不等式 Hoeffding's inequality

霍夫丁不等式将单个随机变量的指数界扩展到了多个独立随机变量和的尾部概率估计。

**定理：** 设 $X_1, X_2, \dots, X_N$ 为互相独立的随机变量，且每个 $X_i$ 都有界，即 $X_i \in [a_i, b_i]$。记 $\bar{X} = \frac{1}{N}\sum_{i=1}^N X_i$，其期望为 $\mu = E[\bar{X}]$。则对于任意 $\varepsilon > 0$，有：

1. 单侧上界：

   $$P(\bar{X} - \mu \ge \varepsilon) \le \exp\left( -\frac{2N^2\varepsilon^2}{\sum_{i=1}^N (b_i - a_i)^2} \right)$$

2. 双侧上界：

   $$P(\vert{}\bar{X} - \mu\vert{} \ge \varepsilon) \le 2\exp\left( -\frac{2N^2\varepsilon^2}{\sum_{i=1}^N (b_i - a_i)^2} \right)$$

在机器学习（如 PAC 学习理论）中，若 $X_i \in [0, 1]$（如伯努利试验的损失函数值），则 $b_i - a_i = 1$，上式化简为经典的 PAC 约束形式：
$$P(\vert{}E_{in}(h) - E_{out}(h)\vert{} \ge \varepsilon) \le 2e^{-2N\varepsilon^2}$$
**证明：**

考虑单侧概率 $P(\bar{X} - \mu \ge \varepsilon)$。令 $S_N = \sum_{i=1}^N (X_i - E[X_i])$，则 $\bar{X} - \mu = \frac{S_N}{N}$。事件可变形为 $S_N \ge N\varepsilon$。

对任意 $\lambda > 0$，利用指数函数的单调递增性与**马尔可夫不等式**：
$$P(S_N \ge N\varepsilon) = P(e^{\lambda S_N} \ge e^{\lambda N\varepsilon}) \le \frac{E[e^{\lambda S_N}]}{e^{\lambda N\varepsilon}} = e^{-\lambda N\varepsilon} E\left[ \prod_{i=1}^N e^{\lambda(X_i - E[X_i])} \right]$$
由于 $X_1, \dots, X_N$ 相互独立，积的期望等于期望的积：
$$E\left[ \prod_{i=1}^N e^{\lambda(X_i - E[X_i])} \right] = \prod_{i=1}^N E\left[ e^{\lambda(X_i - E[X_i])} \right]$$
对每一项应用**霍夫丁引理**（$X_i \in [a_i, b_i]$）：
$$E\left[ e^{\lambda(X_i - E[X_i])} \right] \le \exp\left( \frac{\lambda^2(b_i - a_i)^2}{8} \right)$$
带回原概率表达式：
$$P(\bar{X} - \mu \ge \varepsilon) \le e^{-\lambda N\varepsilon} \prod_{i=1}^N \exp\left( \frac{\lambda^2(b_i - a_i)^2}{8} \right) = \exp\left( -\lambda N\varepsilon + \frac{\lambda^2}{8} \sum_{i=1}^N (b_i - a_i)^2 \right)$$
为了得到最紧（最小）的上界，对右式关于 $\lambda > 0$ 求极小值（二次函数配方或求导）：

令 $f(\lambda) = -\lambda N\varepsilon + \frac{\lambda^2}{8} \sum_{i=1}^N (b_i - a_i)^2$，求导令其为 $0$ 得最佳 $\lambda^*$：$$\lambda^* = \frac{4N\varepsilon}{\sum_{i=1}^N (b_i - a_i)^2}$$

将 $\lambda^*$ 代回表达式：
$$P(\bar{X} - \mu \ge \varepsilon) \le \exp\left( -\frac{2N^2\varepsilon^2}{\sum_{i=1}^N (b_i - a_i)^2} \right)$$
同理可证反向尾部 $P(\bar{X} - \mu \le -\varepsilon) \le \exp\left( -\frac{2N^2\varepsilon^2}{\sum_{i=1}^N (b_i - a_i)^2} \right)$。

结合两端概率（借助结合律/Union Bound）：
$$P(\vert{}\bar{X} - \mu\vert{} \ge \varepsilon) = P(\bar{X} - \mu \ge \varepsilon) + P(\bar{X} - \mu \le -\varepsilon) \le 2\exp\left( -\frac{2N^2\varepsilon^2}{\sum_{i=1}^N (b_i - a_i)^2} \right)$$
证毕.

## 总结

| **不等式**    | **已知条件**                     | **尾部概率上界特征**                            | **适用场景**          |
| ------------- | -------------------------------- | ----------------------------------------------- | --------------------- |
| **Markov**    | 仅已知均值 $\mu$（非负变量）     | $O(\frac{1}{\varepsilon})$（多项式衰减，最松）  | 最基础的概率上界      |
| **Chebyshev** | 已知均值 $\mu$ 与方差 $\sigma^2$ | $O(\frac{1}{\varepsilon^2})$（多项式衰减）      | 大数定理的理论基础    |
| **Hoeffding** | 变量独立且严格有界               | $O(e^{-c N \varepsilon^2})$（指数级衰减，极紧） | 机器学习 PAC 学习理论 |
