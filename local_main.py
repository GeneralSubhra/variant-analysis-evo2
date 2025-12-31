import base64
from io import BytesIO
import gzip
import os
import re
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import seaborn as sns
from Bio import SeqIO
from sklearn.metrics import roc_auc_score
from evo2 import Evo2
import torch  # Required for the fix

# Disable TQDM
os.environ["VORTEX_DISABLE_TQDM"] = "1"

def clean_sequence(seq):
    if not isinstance(seq, str): return ""
    return seq.upper().replace('N', 'A')

def run_brca1_analysis():
    WINDOW_SIZE = 8192
    MODEL_NAME = 'evo2_1b_base'
    
    print(f"Loading {MODEL_NAME}...")
    try:
        model = Evo2(MODEL_NAME)
        
        # --- THE FIX: FORCE FULL PRECISION (FLOAT32) ---
        print("Forcing model to Float32 to prevent NaNs...")
        # If Evo2 inherits from nn.Module, this works:
        if hasattr(model, 'to'):
            model.to(torch.float32)
        # If it's a wrapper hiding the model, try to access internal attributes:
        elif hasattr(model, 'model'):
            model.model.to(torch.float32)
        else:
            print("Warning: Could not automatically cast model. Attempting manual parameter cast.")
            for param in model.parameters():
                param.data = param.data.float()
        print("Model precision updated.")
        # -----------------------------------------------

    except Exception as e:
        print(f"Error loading model: {e}")
        return {}
        
    # --- SANITY CHECK (AGAIN) ---
    print("Running Sanity Check...")
    try:
        test_score = model.score_sequences(["ACGT" * 200])
        val = float(test_score[0].item() if hasattr(test_score[0], 'item') else test_score[0])
        print(f"Sanity Check Score: {val}")
        if np.isnan(val):
            print("CRITICAL: Model still returning NaNs. Your environment might be fundamentally incompatible.")
            return {}
    except Exception as e:
        print(f"Sanity Check Crashed: {e}")
        return {}
    # ---------------------------

    # Paths
    excel_path = os.path.join("evo2", "notebooks", "brca1", "41586_2018_461_MOESM3_ESM.xlsx")
    fasta_path = os.path.join("evo2", "notebooks", "brca1", "GRCh37.p13_chr17.fna.gz")
    
    print("Reading Data...")
    brca1_df = pd.read_excel(excel_path, header=2)
    brca1_df.rename(columns={'position (hg19)': 'pos', 'reference': 'ref', 'alt': 'alt', 'func.class': 'class'}, inplace=True)
    brca1_df['class'] = brca1_df['class'].replace(['FUNC', 'INT'], 'FUNC/INT')
    
    with gzip.open(fasta_path, "rt") as handle:
        seq_record = next(SeqIO.parse(handle, "fasta"))
        seq_chr17 = clean_sequence(str(seq_record.seq))

    ref_seqs = []
    ref_seq_to_index = {}
    ref_seq_indexes = []
    var_seqs = []
    
    # Let's try 500 again now that the math is fixed
    brca1_subset = brca1_df.iloc[:500].copy() 

    for _, row in brca1_subset.iterrows():
        p = int(row["pos"]) - 1 
        
        ref_seq_start = max(0, p - WINDOW_SIZE//2)
        ref_seq_end = min(len(seq_chr17), p + WINDOW_SIZE//2)
        ref_seq = seq_chr17[ref_seq_start:ref_seq_end]
        
        snv_pos_in_ref = min(WINDOW_SIZE//2, p)
        alt_base = clean_sequence(str(row["alt"]))
        var_seq = ref_seq[:snv_pos_in_ref] + alt_base + ref_seq[snv_pos_in_ref+1:]

        if ref_seq not in ref_seq_to_index:
            ref_seq_to_index[ref_seq] = len(ref_seqs)
            ref_seqs.append(ref_seq)
        
        ref_seq_indexes.append(ref_seq_to_index[ref_seq])
        var_seqs.append(var_seq)

    ref_seq_indexes = np.array(ref_seq_indexes)

    print(f'Scoring {len(ref_seqs)} ref sequences...')
    ref_scores_raw = model.score_sequences(ref_seqs)
    
    print(f'Scoring {len(var_seqs)} var sequences...')
    var_scores_raw = model.score_sequences(var_seqs)
    
    def to_cpu_numpy(scores):
        clean_scores = []
        for s in scores:
            val = s.item() if hasattr(s, 'item') else s
            clean_scores.append(float(val))
        return np.array(clean_scores)

    ref_scores = to_cpu_numpy(ref_scores_raw)
    var_scores = to_cpu_numpy(var_scores_raw)

    delta_scores = var_scores - ref_scores[ref_seq_indexes]
    brca1_subset['evo2_delta_score'] = delta_scores
    
    brca1_subset.dropna(subset=['evo2_delta_score'], inplace=True)
    
    if len(brca1_subset) == 0:
        print("All variants dropped.")
        return {}

    y_true = (brca1_subset['class'] == 'LOF')
    auroc = roc_auc_score(y_true, -brca1_subset['evo2_delta_score'])
    print(f"AUROC: {auroc:.4f}")

    # Plotting
    plt.figure(figsize=(4, 2))
    p = sns.stripplot(data=brca1_subset, x='evo2_delta_score', y='class', hue='class',
                      order=['FUNC/INT', 'LOF'], palette=['#777777', 'C3'], size=2, jitter=0.3)

    sns.boxplot(showmeans=True, meanline=True, meanprops={'visible': False},
                medianprops={'color': 'k', 'ls': '-', 'lw': 2}, whiskerprops={'visible': False},
                zorder=10, x="evo2_delta_score", y="class", data=brca1_subset,
                showfliers=False, showbox=False, showcaps=False, ax=p)
    plt.tight_layout()
    
    buffer = BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    plot_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()
    
    return {'variants': brca1_subset.to_dict(orient="records"), "plot": plot_data, "auroc": auroc}

def brca1_example():
    result = run_brca1_analysis()
    if result and "plot" in result:
        plot_data = base64.b64decode(result["plot"])
        with open("brca1_analysis_plot.png","wb") as f:
            f.write(plot_data)
        try:
            img = mpimg.imread(BytesIO(plot_data))
            plt.figure(figsize=(10,5))
            plt.imshow(img)
            plt.axis("off")
            plt.show()
        except: pass

if __name__ == "__main__":
    brca1_example()