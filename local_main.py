import base64
from io import BytesIO
import gzip
import os

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from Bio import SeqIO
from sklearn.metrics import roc_auc_score
from evo2 import Evo2

WINDOW_SIZE = 2048



def run_brca1_analysis():
    print("Loading Evo2 model...")
    model = Evo2("evo2_1b_base")
    print("Evo2 loaded")

    brca1_df = pd.read_excel(
        "evo2/notebooks/brca1/41586_2018_461_MOESM3_ESM.xlsx",
        header=2,
    )

    brca1_df.rename(columns={
        'chromosome': 'chrom',
        'position (hg19)': 'pos',
        'reference': 'ref',
        'alt': 'alt',
        'function.score.mean': 'score',
        'func.class': 'class',
    }, inplace=True)

    brca1_df['class'] = brca1_df['class'].replace(['FUNC', 'INT'], 'FUNC/INT')

    with gzip.open(
        "evo2/notebooks/brca1/GRCh37.p13_chr17.fna.gz", "rt"
    ) as handle:
        seq_chr17 = str(next(SeqIO.parse(handle, "fasta")).seq)

    ref_seqs, var_seqs, ref_seq_indexes = [], [], []
    ref_seq_to_index = {}

    brca1_subset = brca1_df.iloc[:500].copy()

    for _, row in brca1_subset.iterrows():
        p = row["pos"] - 1
        ref_start = max(0, p - WINDOW_SIZE // 2)
        ref_end = min(len(seq_chr17), p + WINDOW_SIZE // 2)

        ref_seq = seq_chr17[ref_start:ref_end]
        snv_pos = min(WINDOW_SIZE // 2, p)
        var_seq = ref_seq[:snv_pos] + row["alt"] + ref_seq[snv_pos + 1:]

        if ref_seq not in ref_seq_to_index:
            ref_seq_to_index[ref_seq] = len(ref_seqs)
            ref_seqs.append(ref_seq)

        ref_seq_indexes.append(ref_seq_to_index[ref_seq])
        var_seqs.append(var_seq)

    print("Scoring reference sequences...")
    ref_scores = model.score_sequences(ref_seqs, batch_size=1)

    print("Scoring variant sequences...")
    var_scores = model.score_sequences(var_seqs, batch_size=1)

    delta_scores = np.array(var_scores) - np.array(ref_scores)[ref_seq_indexes]
    brca1_subset["evo2_delta_score"] = delta_scores

    # ============================================================
    # ✅ FIX: Drop NaN / Inf before AUROC
    # ============================================================
    mask = np.isfinite(brca1_subset["evo2_delta_score"].values)

    y_true = (brca1_subset.loc[mask, "class"] == "LOF").values
    scores = brca1_subset.loc[mask, "evo2_delta_score"].values

    print(f"Valid variants: {mask.sum()}/{len(mask)}")

    auroc = roc_auc_score(y_true, -scores)
    print(f"AUROC: {auroc:.4f}")

    # ============================================================
    # Plot (only valid points)
    # ============================================================
    plt.figure(figsize=(6, 3))
    sns.stripplot(
        data=brca1_subset.loc[mask],
        x="evo2_delta_score",
        y="class",
        jitter=0.3,
        size=3
    )
    plt.tight_layout()
    plt.savefig("brca1_analysis_plot.png")
    plt.show()

    return auroc


if __name__ == "__main__":
    run_brca1_analysis()
