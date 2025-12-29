# Race Insights Guide

This guide explains all the tactical information displayed in your player card during a race. Understanding these metrics will help you make better tactical decisions.

## Player Card Overview

Each player has a tactical card showing real-time performance metrics. Here's what each section means:

---

## Player Identity

**Player Name** - Your boat's name (editable before race starts)

**Position Badge (#1, #2, etc.)** - Your current position in the race based on distance to the windward mark
- **#1** (Gold) - Leading
- **#2** (Silver) - Second place
- **#3** (Bronze) - Third place
- **#4+** (Gray) - Other positions

**Tack Indicator** - Shows which tack you're currently on:
- **P** (Red) - Port tack (wind coming from starboard)
- **S** (Teal) - Starboard tack (wind coming from port)

---

## Decision Flags

### TACK SOON / TACK NOW

These flags appear when you should consider tacking:

- **TACK NOW** (Red, pulsing) - Urgent! You're on a header and losing significant VMG. Tack immediately.
- **TACK SOON** (Yellow) - Consider tacking soon. You're experiencing a header or the opposite tack has better VMG.

**When to Tack:**
- When you see "TACK NOW" - tack immediately
- When you see "TACK SOON" - evaluate if the opposite tack would be better
- When Tack Advantage shows negative (opposite tack is better)

---

## Lift/Header Bar

The horizontal bar shows wind shift effects relative to your course to the mark.

**How to Read:**
- **Left side (Red)** = HEADER zone
- **Right side (Green)** = LIFT zone
- **Center line** = No shift

**What It Shows:**
- **Green fill extending right** = You're experiencing a LIFT (wind shift helps you)
- **Red fill extending left** = You're experiencing a HEADER (wind shift hurts you)
- **Number** = Amount of shift in degrees (±)

**What It Means:**
- **LIFT** (↗) - Wind shift allows you to sail closer to the mark. This is GOOD!
- **HEADER** (↘) - Wind shift forces you away from the mark. This is BAD!

**Action:**
- Large header (>15°) + low VMG = Consider tacking
- Large lift = Stay on current tack and enjoy the advantage

---

## Angle to Wind (ATW)

**What It Is:** The angle between your boat's heading and the wind direction.

**Display:**
- **Current ATW** - Your actual angle (e.g., 70°)
- **Target** - Optimal angle (45° for upwind)
- **Delta** - Difference from target (+40° means you're sailing too wide)

**Color Coding:**
- 🟢 **Green** - Within 2° of optimal (excellent)
- 🟡 **Yellow** - Within 5° of optimal (good)
- 🔴 **Red** - More than 5° off optimal (needs adjustment)

**What It Means:**
- **Too low (<42°)** - You're pinching (sailing too close to the wind)
- **Too high (>50°)** - You're footing (sailing too wide)
- **Just right (45°)** - Optimal VMG angle

**Action:**
- If red, adjust your heading toward the target angle
- Green = you're sailing efficiently

---

## VMG (Velocity Made Good)

**What It Is:** Your speed toward the mark. This is the most important metric!

**Display:**
- **VMG Value** - Speed toward mark in knots (e.g., 0.15 kt)
- **Percentage** - Efficiency compared to optimal (e.g., 15%)
- **Bar** - Visual indicator:
  - 🟢 Green = 95%+ (excellent)
  - 🟡 Yellow = 85-95% (good)
  - 🔴 Red = <85% (poor)

**Trend Arrow:**
- **▲** - VMG increasing (getting better)
- **▼** - VMG decreasing (getting worse)

**What It Means:**
- **High VMG** = Making good progress toward the mark
- **Low VMG** = Not making good progress (even if boat speed is high)

**Action:**
- Aim for 95%+ VMG efficiency
- If VMG drops below 85%, check your heading and tack
- Watch the trend - if VMG is dropping, something needs to change

---

## Wind Shift

**What It Is:** Shows the most recent wind shift and its effect.

**Display:**
- **Arrow** - Direction of shift (↗ lift, ↘ header)
- **LIFT or HEADER** - Type of shift
- **Amount** - Degrees of shift (e.g., +70°)

**What It Means:**
- **LIFT** - Wind shifted in your favor, improving your angle to the mark
- **HEADER** - Wind shifted against you, worsening your angle to the mark

**Action:**
- Large header (>15°) = Consider tacking
- Large lift = Stay on current tack
- Small shifts (<5°) = Usually not significant enough to tack

---

## Mode

**What It Is:** Your current sailing mode based on angle to wind.

**Modes:**
- **VMG MODE** - Sailing at optimal VMG angle (best!)
- **FOOTING** - Sailing wider than optimal (too much angle to wind)
- **PINCHING** - Sailing too close to the wind (too little angle)
- **POINTING** - Sailing higher than optimal (prioritizing angle over speed)

**What It Means:**
- **VMG MODE** = You're sailing efficiently
- **FOOTING** = You're sailing too wide, losing VMG
- **PINCHING** = You're sailing too close, losing speed

**Action:**
- Aim for VMG MODE
- If FOOTING, head up (closer to wind)
- If PINCHING, bear away (wider from wind)

---

## Heading

**What It Is:** Your boat's current heading compared to optimal heading.

**Display:**
- **HDG** - Your current heading (e.g., -45°)
- **OPT** - Optimal heading for your tack (e.g., -5°)
- **Delta** - Difference from optimal (e.g., +40°)

**What It Means:**
- **HDG matches OPT** = You're sailing at the optimal angle
- **Large delta** = You're off the optimal heading

**Action:**
- Small delta (<3°) = Good, stay the course
- Large delta (>5°) = Adjust heading toward OPT
- Remember: Optimal heading changes with wind shifts!

---

## Tack Advantage

**What It Is:** Comparison of your current tack vs. the opposite tack.

**Display:**
- **Percentage** - Advantage of current tack (positive) or disadvantage (negative)
- **Color:**
  - 🟢 Green border = Current tack is better
  - 🔴 Red border = Opposite tack would be better

**What It Means:**
- **Positive %** = Your current tack is better
- **Negative %** = The opposite tack would be better

**Action:**
- If negative and VMG is low, consider tacking
- If positive, stay on current tack
- Use with "TACK SOON" flag - if both suggest tacking, do it!

---

## Speed

**What It Is:** Your boat's current speed through the water.

**Display:**
- **Value** - Speed in knots (e.g., 1.0 kt)

**What It Means:**
- Base speed is 1.0 kt
- Speed can be reduced by:
  - Sailing too close to the wind (pinching)
  - Dirty air from other boats
  - Poor angle to wind

**Note:** Speed alone doesn't tell the whole story - VMG is more important!

---

## Power

**What It Is:** Whether you're sailing at the right angle for optimal power.

**States:**
- **POWERED** - Sailing at optimal angle (good!)
- **OVERPOWERED** - Sailing too wide, not using wind efficiently (yellow)
- **UNDERPOWERED** - Sailing too close, losing speed (red)

**What It Means:**
- **POWERED** = Optimal angle to wind
- **OVERPOWERED** = Too much angle (footing)
- **UNDERPOWERED** = Too little angle (pinching)

**Action:**
- If OVERPOWERED, head up (closer to wind)
- If UNDERPOWERED, bear away (wider from wind)
- Aim for POWERED state

---

## Last Shift

**What It Is:** Time since the last significant wind shift.

**Display:**
- **"Xs ago"** - Seconds since last shift (only shown if <30 seconds)

**What It Means:**
- Shows how recent the wind shift was
- Helps you understand if you're still reacting to a shift

**Action:**
- If shift was recent, you may still be adjusting
- If shift was a while ago, current conditions are stable

---

## How to Use These Insights

### Quick Decision Guide

1. **Check Decision Flags First**
   - "TACK NOW" = Tack immediately
   - "TACK SOON" = Evaluate tacking

2. **Check VMG**
   - If <85%, something is wrong
   - Check ATW, Mode, and Heading

3. **Check Lift/Header**
   - Large header + low VMG = Consider tacking
   - Large lift = Stay on current tack

4. **Check Tack Advantage**
   - Negative = Opposite tack might be better
   - Combine with other signals

5. **Check Mode**
   - VMG MODE = Good!
   - FOOTING/PINCHING = Adjust heading

### Common Scenarios

**Scenario 1: Low VMG (<85%)**
- Check ATW - is it red?
- Check Mode - are you FOOTING or PINCHING?
- Check Heading - is delta large?
- **Action:** Adjust heading toward optimal, or consider tacking

**Scenario 2: Header Detected**
- Check header amount (>15° is significant)
- Check VMG (is it dropping?)
- Check Tack Advantage (is opposite tack better?)
- **Action:** If header is large and VMG is low, tack

**Scenario 3: Lift Detected**
- Check lift amount
- Check VMG (should be improving)
- **Action:** Stay on current tack and enjoy the advantage

**Scenario 4: TACK SOON Flag**
- Check Tack Advantage (is it negative?)
- Check VMG (is it below 90%?)
- Check Header (are you on a header?)
- **Action:** If multiple signals suggest tacking, do it!

---

## Tips for Better Performance

1. **Monitor VMG Constantly** - This is your most important metric
2. **Watch for Wind Shifts** - React quickly to headers, stay on lifts
3. **Use Tack Advantage** - It tells you which tack is better
4. **Aim for VMG MODE** - This means you're sailing efficiently
5. **Keep ATW Green** - Stay within 2° of optimal angle
6. **Combine Signals** - Don't rely on just one metric

---

## Understanding the Numbers

### Good Performance Indicators
- ✅ VMG efficiency: 95%+
- ✅ ATW: Green (within 2° of 45°)
- ✅ Mode: VMG MODE
- ✅ Power: POWERED
- ✅ Tack Advantage: Positive
- ✅ Lift detected (not header)

### Warning Signs
- ⚠️ VMG efficiency: <85%
- ⚠️ ATW: Red (>5° off optimal)
- ⚠️ Mode: FOOTING or PINCHING
- ⚠️ Power: OVERPOWERED or UNDERPOWERED
- ⚠️ Tack Advantage: Negative
- ⚠️ Header detected (>15°)
- ⚠️ TACK SOON or TACK NOW flag

---

## Practice Makes Perfect

The best way to learn is to:
1. **Watch the metrics** as you sail
2. **Try different strategies** and see how metrics change
3. **React to wind shifts** quickly
4. **Learn from AI players** - watch what they do
5. **Experiment** - try tacking at different times and see the results

Remember: These metrics are tools to help you make better decisions. The more you use them, the better you'll become at reading the race and making tactical choices!

