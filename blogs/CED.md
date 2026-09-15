---
title: CED
date: 2026-09-05
summary: 《Continuous Edit Distance for Time-varying Persistence Diagrams》论文阅读
tags: [Academic, Persistence Diagram, Edit Distance, Geodesic, Barycenter]
draft: false
cover: /covers/CED.svg
---


# Continuous Edit Distance for Time-varying Persistence Diagrams

> **论文：** Continuous Edit Distance, Geodesics and Barycenters of Time-varying Persistence Diagrams
> **arXiv：** 2512.12939
> **项目：** ContinuousEditDistance
> **作者：** Sebastien Tchitchek, Mohamed Kissi, Julien Tierny

------

# 1. 论文简介

这篇论文研究的是 **Time-varying Persistence Diagrams（TVPD）** 的比较问题。

传统的 Persistence Diagram（PD）用于描述数据中的拓扑结构，例如：

- 连通分支
- 环
- 空洞
- 更高维拓扑结构

普通 Persistence Diagram 是一个静态对象：

DD

而 Time-varying Persistence Diagram 则是随时间变化的：$D(t),t \in [0,T]$

因此，一个 TVPD 实际上可以理解为一条 Persistence Diagram 的时间演化轨迹：

```text
D(0) → D(1) → D(2) → ... → D(T)
```

论文的核心问题是：

> **如何定义一个合理的距离，用来比较两个随时间变化的 Persistence Diagram？**

作者提出：

$$
\boxed{\text{Continuous Edit Distance (CED)}}
$$

CED 不仅考虑两个 Persistence Diagram 在空间上的差异，同时允许两个动态过程存在**时间错位（temporal misalignment）**，并考虑拓扑特征的插入、删除和匹配。

在 CED 的基础上，论文进一步研究：

- Geodesics（测地线）
- Barycenters（重心）
- Clustering（聚类）
- Classification（分类）

------

# 2. 为什么需要 CED？

## 2.1 普通 Persistence Diagram 的局限

对于两个静态 Persistence Diagram：$D1,D2$

我们可以使用 Wasserstein distance 等方法比较它们。

但是对于时间变化的 Persistence Diagram：$D1(t),D2(t)$

仅仅逐个时间点比较：$d(D1(t),D2(t))$

存在一个重要问题：

> 两个动态过程可能具有相同的演化模式，但发生的时间不同。

例如：

```text
Graph / Process A

t=1      t=2      t=3
 ●   →    ●   →    ●


Graph / Process B

t=3      t=4      t=5
 ●   →    ●   →    ●
```

两个过程实际上具有相同的动态模式：$A\rightarrow B\rightarrow C$

只是 B 比 A 晚发生。如果强制要求：$t=t'$

进行比较，那么会错误地认为两个过程差异很大。

因此，需要一种能够处理：$t \leftrightarrow t'$ 时间对齐关系的距离。

------

# 3. Time-varying Persistence Diagram

论文研究的基本对象是：$D(t)$

其中每一个时间 tt 都对应一个 Persistence Diagram。

可以把它理解为：

```text
Time

t0       t1       t2       t3

 ●        ●
          ●        ●
                   ●        ●
                            ●
```

因此输入并不是一个普通的点集，而是：$\{D(t)\},t∈[0,T]$

两个需要比较的对象分别为：$D_1(t)$和$D_2(t)$

------

# 4. CED 的核心思想

## 4.1 输入与输出

CED 的核心形式可以概括为：$\boxed{ (D_1(t),D_2(t)) \rightarrow d_{\mathrm{CED}}(D_1,D_2) }$

### 输入

两个 Time-varying Persistence Diagrams：$D_1(t),D_2(t)$

以及控制距离计算的参数。

### 输出

一个标量：$\boxed{ d_{\mathrm{CED}}(D_1,D_2) }$

表示两个时间变化 Persistence Diagram 的差异程度。

距离越小：$d_{\mathrm{CED}}(D_1,D_2)\rightarrow 0$

说明两个动态过程越相似。

------

# 5. CED 同时考虑三个因素

CED 可以从直觉上理解为：

$\boxed{ \text{CED} = \text{Diagram discrepancy} + \text{Temporal misalignment} + \text{Edit cost} }$

也就是说，它同时考虑：

### ① Diagram discrepancy

两个 Persistence Diagram 中拓扑特征的位置差异。

------

### ② Temporal misalignment

两个拓扑变化发生的时间是否一致。

例如：

```text
A:  ●────●────●
    1    2    3

B:       ●────●────●
         2    3    4
```

CED 可以允许这种时间偏移。

------

### ③ Edit cost

允许拓扑特征：

- 匹配
- 插入
- 删除

因此它具有 Edit Distance 的思想。

------

# 6. 参数 α 和 β

论文中有两个非常重要的参数：$\alpha$ 和 $\beta$

## α：时间错位与 Diagram 差异之间的权衡

$\alpha$ 控制：

> temporal misalignment 与 diagram discrepancy 的相对重要程度。

直观上：

```text
α 较小 更允许时间发生偏移
α 较大 更加重视时间上的一致性
```

------

## β：Gap Penalty

$\beta$ 控制插入/删除操作的代价。如果：$\beta\uparrow$

删除或插入一个 persistence feature 的成本更高，因此算法更加倾向于寻找已有特征之间的匹配。

------

# 7. CED 的基本过程

可以将 CED 的计算过程概括为：

```text
        TVPD 1
           │
           │
           ▼
     Temporal Alignment
           │
           ▼
     Persistence Matching
           │
     ┌─────┴─────┐
     │           │
 substitution   insertion/deletion
     │           │
     └─────┬─────┘
           ▼
        Cost
           │
           ▼
          CED
```

核心目标是：

> 找到一种时间对齐和 Persistence Feature 匹配方式，使整体编辑代价最小。

因此：

$d_{\mathrm{CED}}(D_1,D_2) = \min_{\text{alignment/matching}} \text{Total Cost}$

------

# 8. Geodesics

论文不仅希望知道：

> 两个 TVPD 有多相似？

还进一步提出：

> 一个 TVPD 如何逐渐变成另一个 TVPD？

这就引出了 **Geodesic（测地线）**。

给定：$D_1,D_2$可以寻找一条路径：$D_1 \rightarrow D(t_1) \rightarrow D(t_2) \rightarrow \cdots \rightarrow D_2$

使得路径长度最小。可以理解为：

```text
D1
 │
 ▼
中间状态 1
 │
 ▼
中间状态 2
 │
 ▼
中间状态 3
 │
 ▼
D2
```

因此 Geodesic 可以用于观察：

> 两个时间变化拓扑结构之间的“最自然变化过程”。

------

# 9. Barycenter

如果只有两个对象，可以研究它们之间的 Geodesic。

如果有很多 TVPD：$D_1,D_2,\ldots,D_n$

则可以进一步寻找一个“平均的” TVPD：$D^*$

即：

$\boxed{ D^*=\operatorname{Barycenter}(D_1,\ldots,D_n) }$

它可以理解成这些时间变化 Persistence Diagrams 的：

> **中心 / 原型 / 平均状态**

------

## 9.1 为什么不能直接求平均？

Persistence Diagram 不是普通的欧氏向量：

$D^*\neq\frac{D_1+D_2+\cdots+D_n}{n}$

因此需要在 CED 所定义的距离空间中寻找 barycenter。

通常可以理解成寻找：

$D^* = \arg\min_D \sum_i d_{\mathrm{CED}}(D,D_i)^2$

------

# 10. Barycenter 的求解

论文研究了两种求解策略：

## 10.1 Stochastic Solver

通过随机方式逐步优化 barycenter。

大致流程：

```text
初始化 barycenter
       ↓
随机选择一个 TVPD
       ↓
计算 CED
       ↓
更新 barycenter
       ↓
重复迭代
```

------

## 10.2 Greedy Solver

使用贪心策略寻找能够降低目标函数的修改。

```text
当前 barycenter
       ↓
尝试修改
       ↓
计算 energy
       ↓
如果 energy 降低
       ↓
接受修改
       ↓
继续
```

论文表明，两种方法都能够降低 CED Fréchet Energy。

------

# 11. Clustering

有了 CED 之后，就可以计算任意两个 TVPD：

$d_{ij} = d_{\mathrm{CED}}(D_i,D_j)$

于是可以构造距离矩阵：

$D= \begin{bmatrix} 0 & d_{12} & \cdots & d_{1n}\\ d_{21} & 0 & \cdots & d_{2n}\\ \vdots & \vdots & \ddots & \vdots\\ d_{n1} & d_{n2} & \cdots & 0 \end{bmatrix}$

然后利用这个距离进行 clustering。

例如：

```text
TVPD 1 ──┐
TVPD 2 ──┤
TVPD 3 ──┤── Cluster 1
          │
TVPD 4 ──┤
TVPD 5 ──┘

TVPD 6 ──┐
TVPD 7 ──┤── Cluster 2
TVPD 8 ──┘
```

------

# 12. Classification

CED 不仅可以用于无监督聚类，也可以用于分类。

基本思想是：

```text
训练数据
   │
   ▼
计算 CED
   │
   ▼
构造距离 / barycenter
   │
   ▼
比较测试样本
   │
   ▼
Classification
```

尤其可以利用不同类别的 barycenter 作为类别原型：$B_1,B_2,\ldots,B_C$

对于新的 TVPD：$D_{\text{test}}$

计算：$d_{\mathrm{CED}}(D_{\text{test}},B_c)$

然后选择距离最小的类别：

$\hat y = \arg\min_c d_{\mathrm{CED}}(D_{\text{test}},B_c)$

------

# 13. 实验部分

论文实验主要关注以下几个问题。

## 13.1 Temporal Perturbation

人为改变时间信息：

```text
Original:

●───●───●───●


Perturbed:

  ●────●────●──●
```

测试 CED 是否仍然能够识别两个过程的相似性。

------

## 13.2 Spatial Perturbation

改变 Persistence Diagram 中的点的位置：

```text
Original:

     ●
          ●
  ●


Perturbed:

       ●
            ●
    ●
```

测试 CED 对空间扰动的鲁棒性。

------

## 13.3 Temporal Pattern Search

给定一个时间变化的拓扑模式：$Q(t)$

在数据中寻找与其相似的 TVPD。

因此 CED 可以用于：

> **动态拓扑模式检索。**

------

# 14. 整篇论文的方法框架

把全文压缩成一张图，可以理解为：

```text
                Time-varying Data
                       │
                       ▼
            Persistence Diagrams
                       │
                       ▼
             Time-varying PDs
                       │
                       ▼
          ┌──────────────────────┐
          │ Continuous Edit      │
          │ Distance (CED)       │
          └──────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Distance     Geodesic    Barycenter
          │            │            │
          ▼            ▼            ▼
      Similarity    Evolution     Prototype
          │
          ▼
   ┌───────────────┐
   │               │
   ▼               ▼
Clustering     Classification
```

------

# 15. 论文各章节解读

下面按照论文的章节逻辑进行概括。

## Chapter 1 — Introduction

### 主要内容

介绍为什么需要比较 **Time-varying Persistence Diagrams**。

核心问题是：

传统 Persistence Diagram 的距离主要适用于静态对象，而当 Persistence Diagram 随时间变化时，需要同时处理：

- 拓扑结构差异
- 时间错位
- 特征出现与消失

作者因此提出 Continuous Edit Distance。

### 核心问题

> How to compare two evolving persistence diagrams?

## Chapter 2 — Background

### 主要内容

介绍论文需要的基础知识，包括：

- Persistence Diagram
- Persistent Homology
- Persistence Diagram Distance
- Time-varying Persistence Diagram
- Wasserstein / matching 等相关概念

这一章主要解决：

> **后面 CED 的数学对象到底是什么。**

如果对 TDA 不熟，这一章非常重要。

## Chapter 3 — Continuous Edit Distance

这是论文最核心的一章。

主要内容是正式定义：

$$
\boxed{\text{Continuous Edit Distance}}
$$

作者建立两个 TVPD 之间的：

- temporal correspondence
- feature matching
- substitution cost
- insertion/deletion cost

最终得到：$d_{\mathrm{CED}}(D_1,D_2)$

这一章是理解论文的**核心章节**。

如果你只读一章，优先读这一章。

## Chapter 4 — Geodesics

这一章研究：

> 在 CED 定义的空间中，两个 TVPD 之间如何进行连续变换？

作者构造：$\boxed{\text{CED-Geodesic}}$

从而可以得到：$D_1 \rightarrow D_2$ 之间的最短演化路径。

这一章的重点从：

> “两个对象有多像？”

变成：

> “一个对象怎样变成另一个对象？”

## Chapter 5 — Barycenters

这一章进一步研究多个 TVPD 的中心。

给定：$D_1,\ldots,D_n$

寻找：$D^*$, 使其能够代表这些动态 Persistence Diagrams 的共同结构。

作者提出两种求解方式：

- stochastic solver
- greedy solver

核心概念是：${\text{CED Fréchet Energy}}$

## Chapter 6 — Experiments

实验主要验证：

1. CED 是否能够正确比较 TVPD；
2. 是否能够处理 temporal perturbation；
3. 是否能够处理 spatial perturbation；
4. 是否能够发现相似 temporal patterns；
5. barycenter 是否具有代表性；
6. clustering / classification 是否有效。

实验不仅关注一个距离数值，还验证 CED 构建出来的整个 metric framework。

## Chapter 7 — Conclusion

总结论文贡献：

$$
\boxed{ TVPD \rightarrow CED \rightarrow Geodesic \rightarrow Barycenter }
$$

作者展示了 CED 不仅能够用于距离计算，还可以进一步支持：

- 动态结构比较
- 时间模式检索
- 聚类
- 分类
- 原型构造
- 动态演化分析

------

# 16. Source Code 与论文的对应关系

官方代码仓库：

**ContinuousEditDistance**

项目地址：

https://github.com/sebastien-tchitchek/ContinuousEditDistance

需要注意：

> **CED 的核心实现并不是一个普通 Python 函数 `CED()`。**

项目采用了：

```text
ParaView
    │
    ▼
TTK
    │
    ▼
custom ttk-tchitchek plugin
    │
    ▼
Continuous Edit Distance Filter
```

因此在仓库中直接搜索：

```python
def CED(...)
```

通常不会得到你预期的结果。

真正的 CED filter 位于：

```text
ttk-tchitchek-timevaryingpersistencediagram.zip
```

中。

------

# 17. 官方实验 Pipeline

项目提供了 ParaView State：

```text
vestec_CED_clustering.pvsm
```

可以用于复现实验。

整体流程：

```text
VESTEC Data
     │
     ▼
Time-varying Persistence Diagram
     │
     ▼
CED Filter
     │
     ▼
CED Distance
     │
     ▼
Clustering
```

官方仓库中的数据目录包含用于实验的 TVPD 数据。

------

# 18. 从机器学习角度理解这篇论文

如果你熟悉机器学习，可以把论文理解成：

```text
输入：

D1(t), D2(t)
      │
      ▼
Temporal Alignment
      │
      ▼
Feature Matching
      │
      ▼
Edit Cost
      │
      ▼
Distance
```

所以它本质上不是：

```text
Input → Neural Network → Label
```

而是：

```text
Input
  ↓
Metric
  ↓
Distance
```

然后在这个 metric space 上进一步做：

```text
Distance
   ├── Clustering
   ├── Classification
   ├── Geodesic
   └── Barycenter
```

------

# 19. 与 Temporal Graph 的联系

如果你研究 Temporal Graph，这篇论文有一个非常值得借鉴的思想：

> **不要要求两个 temporal objects 必须严格按照相同的 timestamp 对齐。**

例如两个 Temporal Graph：

```text
Graph A:

t1: A-B
t2: B-C
t3: C-D


Graph B:

t3: A-B
t5: B-C
t7: C-D
```

虽然 timestamp 不一样，但是它们的演化模式可能高度相似：

$A-B \rightarrow B-C \rightarrow C-D$

这时可以考虑寻找一个时间映射：$\phi(t)$

使：$G_1(t) \leftrightarrow G_2(\phi(t))$

然后定义：

$d(G_1,G_2) = \min_{\phi} \left[ d_{\mathrm{structure}} + \lambda d_{\mathrm{temporal}} \right]$

这与 CED 的基本思想具有很强的相似性。

------

# 20. 与 Temporal Graph Kernel 的潜在联系

如果将 CED 得到的距离：$d_{\mathrm{CED}}(G_i,G_j)$

进一步转换成 kernel：

$\boxed{ K(G_i,G_j) = \exp(-\gamma d_{\mathrm{CED}}(G_i,G_j)) }$

就可以形成：

> **Temporal Graph Distance → Temporal Graph Kernel**

然后使用：

- SVM
- Kernel PCA
- Kernel clustering
- Graph classification

等传统 kernel 方法。

这也是这篇论文对 Temporal Graph Kernel 研究比较值得关注的地方。

------

# 21. 最重要的几个概念

| 概念                  | 含义                                  |
| --------------------- | ------------------------------------- |
| Persistence Diagram   | 表示拓扑特征的点集                    |
| TVPD                  | 随时间变化的 Persistence Diagram      |
| CED                   | 比较两个 TVPD 的距离                  |
| Temporal Misalignment | 两个动态过程发生时间不同              |
| Edit Cost             | 特征插入/删除/匹配的代价              |
| Geodesic              | 两个 TVPD 之间的最短演化路径          |
| Barycenter            | 多个 TVPD 的中心/原型                 |
| Fréchet Energy        | 用于优化 barycenter 的目标函数        |
| α                     | 时间错位与 diagram discrepancy 的权衡 |
| β                     | 插入/删除的 gap penalty               |

------

# 22. 一句话总结全文

如果只用一句话概括这篇论文：

> **作者为随时间变化的 Persistence Diagram 构建了一个能够同时处理拓扑特征差异、时间错位以及特征插入/删除的 Continuous Edit Distance，并在此基础上建立了测地线和重心，从而支持动态拓扑数据的比较、聚类和分类。**

最核心的逻辑就是：

$\boxed{ \text{TVPD} \xrightarrow{\text{Temporal Alignment + Edit Matching}} \text{CED} \xrightarrow{} \begin{cases} \text{Distance}\\ \text{Geodesic}\\ \text{Barycenter}\\ \text{Clustering}\\ \text{Classification} \end{cases} }$