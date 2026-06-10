# Stop Shy of the First Down

On first down, an NFL ball-carrier should stop shy of the first-down marker unless
several extra yards are on offer. The decision becomes clear once you calculate the
*implied yards per possession* — a lens that also sheds light on second- and
third-down strategy.

### 🏈 Interactive site → **[firstdown.microprediction.org](https://firstdown.microprediction.org)**

Six interactive figures walk through the argument in expected points: a drive-value
curve with an optimum *before* the marker, the field-position exchange rate, the
central "what would a possession have to be worth?" calculation (≈ 66 yards to justify
reaching), a 2nd-and-1 vs 1st-and-10 simulation, the 3rd-and-1 run/pass decision, and
the distribution of yards gained. Source for the site is in [`docs/`](docs/).

## The paper

Cotton, P. (2022). **“Stop Shy of the First Down.”** *Wilmott*, January 2022, pp. 44–49.

- 📄 Published article — [`wilmott_paper/`](wilmott_paper/)
- 📝 Earlier draft (2021) — [`Stop_Shy_of_the_First_Down_2021_07.pdf`](Stop_Shy_of_the_First_Down_2021_07.pdf)
- 🎓 MIT Sloan Sports Analytics submission — [`Stop_Shy_MIT_submission.docx`](Stop_Shy_MIT_submission.docx)
- ✍️ Discussion — [microprediction.com/blog/nine](https://www.microprediction.com/blog/nine)

## Reproduce it

| Notebook | What it covers |
| --- | --- |
| [`Stop_shy_of_the_first_down.ipynb`](Stop_shy_of_the_first_down.ipynb) [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/microprediction/firstdown/blob/main/Stop_shy_of_the_first_down.ipynb) | The main analysis |
| [`breakdown_by_play_call.ipynb`](breakdown_by_play_call.ipynb) | Run/pass breakdowns |
| [`more_comparisons.ipynb`](more_comparisons.ipynb) | Additional comparisons |
| [`first_down_images_for_paper.ipynb`](first_down_images_for_paper.ipynb) | Figures for the paper |

## Data

NFL play-by-play for the 2009–2013 seasons, compiled by Dilday (2016) and packaged in
[microprediction/nflMarkov](https://github.com/microprediction/nflMarkov)
(`inputData/pbp_nfldb_2009_2013.csv`).

## Related book

*Sports Analytics*, by Leonard C. MacLean and William T. Ziemba — World Scientific
Series in Finance, Vol. 18 (2021):
[worldscientific.com/worldscibooks/10.1142/12566](https://www.worldscientific.com/worldscibooks/10.1142/12566).
A collection of analytic techniques across baseball, basketball, hockey, NFL football,
and horseracing.

If you find this useful, consider following
[microprediction](https://www.linkedin.com/company/65109690) on LinkedIn.

---

![](https://i.imgur.com/bJ7C6gY.jpg)

Photo by <a href="https://unsplash.com/@mkaine17?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Fredrick Lee</a> on <a href="https://unsplash.com/s/photos/nfl?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
