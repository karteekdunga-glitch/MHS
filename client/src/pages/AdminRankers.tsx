import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useRankers, useCreateRanker, useUpdateRanker, useDeleteRanker } from "@/hooks/use-rankers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Loader2, Trophy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminRankers() {
  const { data: rankers, isLoading } = useRankers();
  const createMutation = useCreateRanker();
  const updateMutation = useUpdateRanker();
  const deleteMutation = useDeleteRanker();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ studentName: "", rank: "", year: new Date().getFullYear().toString(), score: "", imageUrl: "", status: "draft" });

  const openEdit = (item: any) => {
    setFormData({ 
      studentName: item.studentName, 
      rank: item.rank.toString(), 
      year: item.year.toString(), 
      score: item.score.toString(), 
      imageUrl: item.imageUrl || "", 
      status: item.status 
    });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const openCreate = () => {
    setFormData({ studentName: "", rank: "", year: new Date().getFullYear().toString(), score: "", imageUrl: "", status: "draft" });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      rank: parseInt(formData.rank, 10),
      year: parseInt(formData.year, 10),
      score: parseInt(formData.score, 10),
    };
    
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-accent"/> Rankers</h2>
          <p className="text-muted-foreground">Manage top achieving students displayed on the homepage.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary"><Plus className="w-4 h-4 mr-2" /> Add Ranker</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Ranker" : "Add Ranker"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Student Name</Label>
                  <Input required value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Rank (e.g. 1)</Label>
                  <Input type="number" required value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Score / Marks</Label>
                  <Input type="number" required value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" required value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Hidden)</SelectItem>
                      <SelectItem value="published">Published (Visible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Image URL (Optional Unsplash URL)</Label>
                  <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://images.unsplash.com/..." />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : rankers?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
            ) : (
              rankers?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.studentName} className="w-full h-full object-cover" />}
                    </div>
                    {item.studentName}
                  </TableCell>
                  <TableCell className="font-bold text-primary">#{item.rank}</TableCell>
                  <TableCell>{item.score}</TableCell>
                  <TableCell>{item.year}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(item.id) }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
